import * as warehouseRepository from '../repositories/warehouseRepository';
import * as orderRepository from '../repositories/orderRepository';
import logger from '../utils/logger';
import { AppError, ValidationError, BusinessLogicError, NotFoundError, ErrorCategory } from '../errors/ErrorTypes';
import { haversineDistanceKm, getDiscountRate, runInTransaction } from '../utils/orderUtils';
import { OrderInput, OrderVerificationResult, OrderSubmissionResult, Allocation, AllocationAndShipping } from '../types/OrderServiceTypes';
import { Warehouse } from '../models/Warehouse';
import { Order as OrderEntity } from '../models/Order';

const DEVICE_PRICE: number = 150;
const DEVICE_WEIGHT_KG: number = 0.365;
const SHIPPING_RATE_PER_KG_KM: number = 0.01;
const SHIPPING_COST_THRESHOLD_PERCENT: number = 0.15;

const sortWarehousesByProximity = (
  warehouses: Warehouse[],
  shipping_latitude: number,
  shipping_longitude: number
): (Warehouse & { distanceKm: number })[] => {
  return warehouses
    .map(warehouse => ({
      ...warehouse,
      distanceKm: haversineDistanceKm(
        warehouse.latitude,
        warehouse.longitude,
        shipping_latitude,
        shipping_longitude
      ),
    }))
    .sort((warehouse1, warehouse2) => warehouse1.distanceKm - warehouse2.distanceKm);
};

const allocateOrderAcrossWarehouses = (
  quantity: number,
  shipping_latitude: number,
  shipping_longitude: number,
  warehouses: Warehouse[]
): AllocationAndShipping => {
  const totalStock: number = warehouses.reduce((sum, warehouse) => sum + warehouse.stock, 0);
  if (totalStock < quantity || warehouses.length === 0) {
    return { allocation: [], totalShippingCost: 0, isStockSufficient: false };
  }
  let devicesRemaining: number = quantity;
  const allocation: Allocation[] = [];
  let totalShippingCost: number = 0;
  const warehousesByDistance = sortWarehousesByProximity(warehouses, shipping_latitude, shipping_longitude);
  for (const warehouse of warehousesByDistance) {
    if (devicesRemaining <= 0) break;
    if (warehouse.stock <= 0) continue;
    const allocatable: number = Math.min(warehouse.stock, devicesRemaining);
    allocation.push({ warehouse: warehouse.name, quantity: allocatable });
    const shippingForThisWarehouse: number = allocatable * DEVICE_WEIGHT_KG * warehouse.distanceKm * SHIPPING_RATE_PER_KG_KM;
    totalShippingCost += shippingForThisWarehouse;
    devicesRemaining -= allocatable;
  }
  return { allocation, totalShippingCost, isStockSufficient: true };
};

const buildAllocationMap = (allocations: Allocation[]): Map<string, number> => {
  return new Map<string, number>(allocations.map(allocation => [allocation.warehouse, allocation.quantity]));
};

/**
 * Verifies an order based on the input quantity and shipping location.
 * It checks if the quantity is positive, calculates the total price, discount, and shipping cost,
 * and ensures that the shipping cost does not exceed 15% of the total price after discount.
 * If the order is valid, it returns the total price, discount, and shipping cost.
 * If the order is invalid, it returns a reason for the failure.
 * @param input OrderInput - The input for order verification, including quantity and shipping location.
 * @returns Promise<OrderVerificationResult> - The result of the order verification.
 */
export const verifyOrder: (input: OrderInput) => Promise<OrderVerificationResult> = async (input: OrderInput) => {
  logger.info({ event: 'verifyOrder', input }, 'Verifying order');

  const invalidOrderBase = {
    isValid: false,
    totalPrice: 0,
    discount: 0,
    shippingCost: 0,
  };

  try {
    if (input.quantity <= 0) {
      logger.warn({ event: 'verifyOrder', input }, 'Order verification failed: Quantity must be positive');
      return {
        ...invalidOrderBase,
        reason: 'Quantity must be positive',
      };
    }

    logger.info({ event: 'verifyOrder' }, 'Fetching all warehouses for allocation calculation');

    const warehouses: Warehouse[] = await warehouseRepository.getWarehouses();
    if (warehouses.length === 0) {
      logger.warn({ event: 'verifyOrder', input }, 'Order verification failed: No warehouses available');
      return {
        ...invalidOrderBase,
        reason: 'No warehouses available to fulfill the order',
      };
    }

    const { totalShippingCost, isStockSufficient }: AllocationAndShipping = allocateOrderAcrossWarehouses(
      input.quantity,
      input.shipping_latitude,
      input.shipping_longitude,
      warehouses
    );

    if (!isStockSufficient) {
      return {
        ...invalidOrderBase,
        reason: 'Not enough stock in all warehouses',
      };
    }

    const discountRate: number = getDiscountRate(input.quantity);
    const totalPrice: number = DEVICE_PRICE * input.quantity * (1 - discountRate);
    const discount: number = DEVICE_PRICE * input.quantity * discountRate;
    const shippingCost: number = Math.round(totalShippingCost * 100) / 100;

    if (totalPrice > 0 && shippingCost > SHIPPING_COST_THRESHOLD_PERCENT * totalPrice) {
      logger.warn({ event: 'verifyOrder', input, shippingCost, totalPrice }, 'Order verification failed: Shipping cost exceeds 15% of order amount');
      return {
        ...invalidOrderBase,
        reason: 'Shipping cost exceeds 15% of the order amount after discount',
      };
    }

    logger.info({ event: 'verifyOrder', totalPrice, discount, shippingCost, isStockSufficient }, 'Order verification result calculated');

    return {
      isValid: true,
      totalPrice,
      discount,
      shippingCost,
    };
  } catch (error: unknown) {
    logger.error({ event: 'verifyOrder', error: error instanceof Error ? error.message : error, input }, 'Order verification failed with exception');
    return {
      ...invalidOrderBase,
      reason: 'unknown error during order verification',
    };
  }
};

/**
 * Verifies an order before submission.
 * This function first verifies the order using `verifyOrder`, and if the verification is successful,
 * it proceeds to allocate the order across available warehouses.
 * It updates the stock in each warehouse based on the allocation and creates a new order record in the database.
 * @param input OrderInput - The input for order submission, including quantity and shipping location.
 * @returns Promise<OrderSubmissionResult> - The result of the order submission.
 */

export const submitOrder: (input: OrderInput) => Promise<OrderSubmissionResult> = async (input) => {
  logger.info({ event: 'submitOrder', input }, 'Submitting order for processing');
  try {
    const verification: OrderVerificationResult = await verifyOrder(input);
    if (!verification.isValid) {
      logger.warn({ event: 'submitOrder', input, reason: verification.reason }, 'Order submission failed: verification failed');
      throw new BusinessLogicError(
        verification.reason || 'Order verification failed',
        { correlationId: '', operation: 'submitOrder', resource: 'order' }
      );
    }
    // Recompute allocation for order submission inside the transaction for consistency
    const result: OrderEntity = await runInTransaction(async (manager) => {
      const warehouses: Warehouse[] = await warehouseRepository.getWarehouses();
      logger.info({ event: 'submitOrder', warehousesCount: warehouses.length }, 'Warehouses fetched for order submission');

      if (warehouses.length === 0) {
        logger.error({ event: 'submitOrder', input }, 'No warehouses available for order submission');
        throw new BusinessLogicError('No warehouses available to fulfill the order');
      }
     
      const { allocation } = allocateOrderAcrossWarehouses(
        input.quantity,
        input.shipping_latitude,
        input.shipping_longitude,
        warehouses
      );
      const allocationMap: Map<string, number> = buildAllocationMap(allocation);

      for (const warehouse of warehouses) {
        const allocationQuantity: number = allocationMap.get(warehouse.name) || 0;
        if (allocationQuantity > 0) {
          if (warehouse.stock < allocationQuantity) {
            logger.error({ event: 'submitOrder', warehouse: warehouse.name, stock: warehouse.stock, allocationQuantity }, 'Stock inconsistency during order submission');
            throw new BusinessLogicError(
              `Warehouse ${warehouse.name} does not have enough stock`
            );
          }
          await manager.getRepository(Warehouse).update(warehouse.id, { stock: warehouse.stock - allocationQuantity });
          logger.info({ event: 'submitOrder', warehouse: warehouse.name, newStock: warehouse.stock - allocationQuantity }, 'Warehouse stock updated');
        }
      }

      const orderData: Partial<OrderEntity> = {
        quantity: input.quantity,
        shipping_latitude: input.shipping_latitude,
        shipping_longitude: input.shipping_longitude,
        total_price: verification.totalPrice,
        discount: verification.discount,
        shipping_cost: verification.shippingCost,
        warehouse_allocation: allocation,
      };

      const createdOrder: OrderEntity = await manager.getRepository(OrderEntity).save(orderData);

      logger.info({ event: 'submitOrder', orderId: createdOrder.id }, 'Order submitted and persisted');

      return createdOrder;
    });
    return {
      id: result.id,
      quantity: result.quantity,
      total_price: result.total_price,
      discount: result.discount,
      shipping_cost: result.shipping_cost,
    };
  } catch (error) {
    logger.error({ event: 'submitOrder', error: error instanceof Error ? error.message : error, input }, 'Order submission failed with error');
    throw error;
  }
};

export const getOrders = orderRepository.getOrders;
export const getOrderById = orderRepository.getOrderById;
