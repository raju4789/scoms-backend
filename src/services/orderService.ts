import * as warehouseRepository from '../repositories/warehouseRepository';
import * as orderRepository from '../repositories/orderRepository';
import logger from '../utils/logger';
import { BusinessLogicError, ValidationError } from '../errors/ErrorTypes';
import { recordError, recordOrderMetric } from '../middleware/metrics';
import {
  allocateOrderAcrossWarehouses,
  buildAllocationMap,
  calculatePricing,
  extractValidationReason,
  INVALID_ORDER_BASE,
  runInTransaction,
  validateOrderInputSafe,
  validateShippingCost,
} from '../utils/orderUtils';
import {
  Allocation,
  OrderInput,
  OrderSubmissionResult,
  OrderVerificationResult,
} from '../types/OrderServiceTypes';
import { Warehouse } from '../models/Warehouse';
import { Order as OrderEntity } from '../models/Order';

/**
 * Verifies an order based on the input quantity and shipping location.
 *
 * Validates quantity, calculates pricing with discounts, determines shipping costs,
 * and ensures shipping cost does not exceed 15% of the discounted total.
 */
export const verifyOrder = async (input: OrderInput): Promise<OrderVerificationResult> => {
  logger.info('Verifying order', { event: 'verifyOrder', input });

  try {
    // Step 1: Validate input
    const validationError = validateOrderInputSafe(input);
    if (validationError) {
      return { ...INVALID_ORDER_BASE, reason: validationError };
    }

    // Step 2: Fetch warehouses
    const warehouses = await warehouseRepository.getWarehouses();
    if (warehouses.length === 0) {
      const reason = 'No warehouses available to fulfill the order';
      logger.warn('No warehouses available', { event: 'verifyOrder', input, reason });
      return { ...INVALID_ORDER_BASE, reason };
    }

    // Step 3: Check stock allocation
    const allocation = allocateOrderAcrossWarehouses(
      input.quantity,
      input.shipping_latitude,
      input.shipping_longitude,
      warehouses
    );

    if (!allocation.isStockSufficient) {
      return { ...INVALID_ORDER_BASE, reason: 'Not enough stock in all warehouses' };
    }

    // Step 4: Calculate pricing
    const pricing = calculatePricing(input.quantity);
    const shippingCost = Math.round(allocation.totalShippingCost * 100) / 100;

    logger.info('Order pricing calculated', { event: 'verifyOrder', ...pricing, shippingCost });

    // Step 5: Validate shipping cost threshold
    const shippingError = validateShippingCost(shippingCost, pricing.totalPrice);
    if (shippingError) {
      logger.warn(shippingError, {
        event: 'verifyOrder',
        input,
        shippingCost,
        totalPrice: pricing.totalPrice,
      });
      return { ...INVALID_ORDER_BASE, reason: shippingError };
    }

    // Step 6: Return successful verification
    logger.info('Order verification successful', {
      event: 'verifyOrder',
      ...pricing,
      shippingCost,
    });

    return {
      isValid: true,
      totalPrice: pricing.totalPrice,
      discount: pricing.discount,
      shippingCost,
    };
  } catch (error: unknown) {
    logger.error('Order verification failed with exception', {
      event: 'verifyOrder',
      error: error instanceof Error ? error.message : error,
      input,
    });

    if (error instanceof ValidationError) {
      return { ...INVALID_ORDER_BASE, reason: extractValidationReason(error) };
    }

    return { ...INVALID_ORDER_BASE, reason: 'Unknown error during order verification' };
  }
};

/**
 * Update warehouse stock within a transaction
 */
const updateWarehouseStock = async (
  manager: import('typeorm').EntityManager,
  warehouses: Warehouse[],
  allocationMap: Map<string, number>
): Promise<void> => {
  for (const warehouse of warehouses) {
    const allocationQuantity = allocationMap.get(warehouse.name) || 0;

    if (allocationQuantity > 0) {
      if (warehouse.stock < allocationQuantity) {
        throw new BusinessLogicError(`Warehouse ${warehouse.name} does not have enough stock`);
      }

      const newStock = warehouse.stock - allocationQuantity;
      await manager.getRepository(Warehouse).update(warehouse.id, { stock: newStock });

      logger.info('Warehouse stock updated', {
        event: 'updateWarehouseStock',
        warehouse: warehouse.name,
        newStock,
      });
    }
  }
};

/**
 * Create order entity within transaction
 */
const createOrderEntity = async (
  manager: import('typeorm').EntityManager,
  input: OrderInput,
  verification: OrderVerificationResult,
  allocation: Allocation[]
): Promise<OrderEntity> => {
  const orderData: Partial<OrderEntity> = {
    quantity: input.quantity,
    shipping_latitude: input.shipping_latitude,
    shipping_longitude: input.shipping_longitude,
    total_price: verification.totalPrice,
    discount: verification.discount,
    shipping_cost: verification.shippingCost,
    warehouse_allocation: allocation,
  };

  const createdOrder = await manager.getRepository(OrderEntity).save(orderData);

  logger.info('Order created', { event: 'createOrderEntity', orderId: createdOrder.id });
  recordOrderMetric('created', 'mixed');

  return createdOrder;
};

/**
 * Submits an order after verification and processes the transaction.
 *
 * Verifies the order, allocates stock across warehouses, updates inventory,
 * and persists the order record within a database transaction.
 */
export const submitOrder = async (input: OrderInput): Promise<OrderSubmissionResult> => {
  logger.info('Submitting order for processing', { event: 'submitOrder', input });

  try {
    // Step 1: Verify order
    const verification = await verifyOrder(input);
    if (!verification.isValid) {
      const reason = verification.reason || 'Order verification failed';
      logger.warn('Order verification failed', { event: 'submitOrder', input, reason });

      throw new BusinessLogicError(reason, {
        correlationId: '',
        operation: 'submitOrder',
        resource: 'order',
      });
    }

    // Step 2: Execute transaction
    const result = await runInTransaction(async manager => {
      // Get fresh warehouse data within transaction
      const warehouses = await warehouseRepository.getWarehouses();
      if (warehouses.length === 0) {
        throw new BusinessLogicError('No warehouses available to fulfill the order');
      }

      // Recalculate allocation for consistency
      const { allocation } = allocateOrderAcrossWarehouses(
        input.quantity,
        input.shipping_latitude,
        input.shipping_longitude,
        warehouses
      );

      const allocationMap = buildAllocationMap(allocation);

      // Update warehouse stock
      await updateWarehouseStock(manager, warehouses, allocationMap);

      // Create order
      return createOrderEntity(manager, input, verification, allocation);
    });

    return {
      id: result.id,
      quantity: result.quantity,
      total_price: result.total_price,
      discount: result.discount,
      shipping_cost: result.shipping_cost,
    };
  } catch (error) {
    logger.error('Order submission failed', {
      event: 'submitOrder',
      error: error instanceof Error ? error.message : String(error),
      input,
    });

    recordError('order_submission_failed', 'error');
    throw error;
  }
};

export const getOrders = orderRepository.getOrders;
export const getOrderById = orderRepository.getOrderById;
