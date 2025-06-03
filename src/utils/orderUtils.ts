import { getDataSource } from '../config/data-source-consul';
import consulService from '../config/consul';
import { ValidationError } from '../errors/ErrorTypes';
import { validateOrderInput } from './orderValidation';
import { Warehouse } from '../models/Warehouse';
import { Allocation, AllocationAndShipping, OrderInput } from '../types/OrderServiceTypes';
import logger from './logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WarehouseWithDistance extends Warehouse {
  distanceKm: number;
}

export interface PricingDetails {
  totalPrice: number;
  discount: number;
  discountRate: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Haversine formula constants
const EARTH_RADIUS_KM: number = 6371;
const DEG_TO_RAD: number = Math.PI / 180;
const HAVERSINE_FACTOR: number = 2;
const HAVERSINE_DIVISOR: number = 2;
const HAVERSINE_EXPONENT: number = 2;

export const INVALID_ORDER_BASE = {
  isValid: false as const,
  totalPrice: 0,
  discount: 0,
  shippingCost: 0,
} as const;

// ============================================================================
// CONSUL CONFIGURATION GETTERS
// ============================================================================

/**
 * Get device price from Consul configuration
 */
export const getDevicePrice = (): number => {
  return consulService.getOrderConfig().devicePrice;
};

/**
 * Get device weight from Consul configuration
 */
export const getDeviceWeight = (): number => {
  return consulService.getOrderConfig().deviceWeightKg;
};

/**
 * Get shipping rate from Consul configuration
 */
export const getShippingRate = (): number => {
  return consulService.getOrderConfig().shippingRatePerKgKm;
};

/**
 * Get shipping cost threshold from Consul configuration
 */
export const getShippingCostThreshold = (): number => {
  return consulService.getOrderConfig().shippingCostThresholdPercent;
};

/**
 * Returns the discount rate for a given quantity based on Consul configuration.
 * @param quantity - The number of items ordered
 * @returns The discount rate as a decimal (e.g., 0.1 for 10%)
 */
export const getDiscountRate = (quantity: number): number => {
  const discountTiers = consulService.getOrderConfig().discountTiers;
  let bestDiscount: number = 0;
  for (const tier of discountTiers) {
    if (quantity >= tier.minQuantity && tier.discount > bestDiscount) {
      bestDiscount = tier.discount;
    }
  }
  return bestDiscount;
};

/**
 * Calculates the great-circle distance between two points on the Earth using the Haversine formula.
 * This is used to determine the shortest distance over the earth's surface between two latitude/longitude coordinates.
 *
 * @param latitude1 - Latitude of the first point in decimal degrees
 * @param longitude1 - Longitude of the first point in decimal degrees
 * @param latitude2 - Latitude of the second point in decimal degrees
 * @param longitude2 - Longitude of the second point in decimal degrees
 * @returns The distance between the two points in kilometers
 */
export const haversineDistanceKm = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number => {
  const toRadians: (degrees: number) => number = degrees => degrees * DEG_TO_RAD;
  const deltaLat: number = toRadians(latitude2 - latitude1);
  const deltaLon: number = toRadians(longitude2 - longitude1);
  const haversineFormulaComponent: number =
    Math.sin(deltaLat / HAVERSINE_DIVISOR) ** HAVERSINE_EXPONENT +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLon / HAVERSINE_DIVISOR) ** HAVERSINE_EXPONENT;
  const centralAngle: number =
    HAVERSINE_FACTOR *
    Math.atan2(Math.sqrt(haversineFormulaComponent), Math.sqrt(1 - haversineFormulaComponent));
  return EARTH_RADIUS_KM * centralAngle;
};

/**
 * Calculate pricing details for an order
 */
export const calculatePricing = (quantity: number): PricingDetails => {
  const discountRate = getDiscountRate(quantity);
  const basePrice = getDevicePrice() * quantity;
  const discount = basePrice * discountRate;
  const totalPrice = basePrice - discount;

  return { totalPrice, discount, discountRate };
};

/**
 * Calculate shipping cost for a specific allocation
 */
export const calculateShippingCost = (quantity: number, distanceKm: number): number => {
  return quantity * getDeviceWeight() * distanceKm * getShippingRate();
};

/**
 * Sort warehouses by proximity to shipping location
 */
export const sortWarehousesByProximity = (
  warehouses: Warehouse[],
  shippingLatitude: number,
  shippingLongitude: number
): WarehouseWithDistance[] => {
  return warehouses
    .map(warehouse => ({
      ...warehouse,
      distanceKm: haversineDistanceKm(
        warehouse.latitude,
        warehouse.longitude,
        shippingLatitude,
        shippingLongitude
      ),
    }))
    .sort((warehouse1, warehouse2) => warehouse1.distanceKm - warehouse2.distanceKm);
};

/**
 * Allocate order across multiple warehouses based on proximity and stock
 */
export const allocateOrderAcrossWarehouses = (
  quantity: number,
  shippingLatitude: number,
  shippingLongitude: number,
  warehouses: Warehouse[]
): AllocationAndShipping => {
  logger.info(
    `[allocateOrderAcrossWarehouses] input: quantity=${quantity}, shippingLatitude=${shippingLatitude}, shippingLongitude=${shippingLongitude}, warehouses=${JSON.stringify(warehouses)}`
  );
  const totalStock = warehouses.reduce((sum, warehouse) => sum + warehouse.stock, 0);

  if (totalStock < quantity || warehouses.length === 0) {
    return { allocation: [], totalShippingCost: 0, isStockSufficient: false };
  }

  let remainingQuantity = quantity;
  const allocation: Allocation[] = [];
  let totalShippingCost = 0;

  const sortedWarehouses = sortWarehousesByProximity(
    warehouses,
    shippingLatitude,
    shippingLongitude
  );

  logger.info(
    `[allocateOrderAcrossWarehouses] sortedWarehouses: ${JSON.stringify(sortedWarehouses)}`
  );

  for (const warehouse of sortedWarehouses) {
    if (remainingQuantity <= 0) break;
    if (warehouse.stock <= 0) continue;

    const allocatedQuantity = Math.min(warehouse.stock, remainingQuantity);
    logger.info(
      `[allocateOrderAcrossWarehouses] allocating: warehouse=${warehouse.name}, allocatedQuantity=${allocatedQuantity}, distanceKm=${warehouse.distanceKm}`
    );
    allocation.push({ warehouse: warehouse.name, quantity: allocatedQuantity });

    totalShippingCost += calculateShippingCost(allocatedQuantity, warehouse.distanceKm);
    remainingQuantity -= allocatedQuantity;
  }

  logger.info(
    `[allocateOrderAcrossWarehouses] result: allocation=${JSON.stringify(allocation)}, totalShippingCost=${totalShippingCost}, isStockSufficient=${totalStock >= quantity}, remainingQuantity=${remainingQuantity}`
  );

  return { allocation, totalShippingCost, isStockSufficient: true };
};

/**
 * Convert allocation array to map for efficient lookups
 */
export const buildAllocationMap = (allocations: Allocation[]): Map<string, number> => {
  return new Map(allocations.map(allocation => [allocation.warehouse, allocation.quantity]));
};

/**
 * Extract validation error reason from ValidationError
 */
export const extractValidationReason = (error: ValidationError): string => {
  if (error.details && typeof error.details === 'object') {
    const firstDetail = Object.values(error.details)[0];
    if (typeof firstDetail === 'string') {
      return firstDetail;
    }
  }
  return error.message;
};

/**
 * Validate order input and return formatted error if invalid
 */
export const validateOrderInputSafe = (input: OrderInput): string | null => {
  try {
    validateOrderInput(input);
    return null;
  } catch (error) {
    if (error instanceof ValidationError) {
      return extractValidationReason(error);
    }
    throw error;
  }
};

/**
 * Validate shipping cost threshold
 */
export const validateShippingCost = (shippingCost: number, totalPrice: number): string | null => {
  logger.info(
    `[validateShippingCost] totalPrice=${totalPrice}, shippingCost=${shippingCost}, threshold=${getShippingCostThreshold() * totalPrice}`
  );
  if (totalPrice > 0 && shippingCost > getShippingCostThreshold() * totalPrice) {
    logger.info('[validateShippingCost] Shipping cost exceeds threshold!');
    return 'Shipping cost exceeds 15% of the order amount after discount';
  }
  return null;
};

/**
 * Runs the given function in a TypeORM transaction and returns its result.
 * Abstracts transaction management out of the service layer.
 */
export async function runInTransaction<T>(
  fn: (manager: import('typeorm').EntityManager) => Promise<T>
): Promise<T> {
  return getDataSource().transaction(fn);
}
