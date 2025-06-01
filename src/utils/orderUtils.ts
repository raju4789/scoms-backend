import { getDataSource } from '../config/data-source-consul';
import consulService from '../config/consul';

// Haversine formula constants
const EARTH_RADIUS_KM: number = 6371;
const DEG_TO_RAD: number = Math.PI / 180;
const HAVERSINE_FACTOR: number = 2;
const HAVERSINE_DIVISOR: number = 2;
const HAVERSINE_EXPONENT: number = 2;

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
 * Calculates the great-circle distance between two points on the Earth using the Haversine formula.
 * This is used to determine the shortest distance over the earth’s surface between two latitude/longitude coordinates.
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
  longitude2: number,
): number => {
  const toRadians: (degrees: number) => number = (degrees) => degrees * DEG_TO_RAD;
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
 * Runs the given function in a TypeORM transaction and returns its result.
 * Abstracts transaction management out of the service layer.
 */
export async function runInTransaction<T>(
  fn: (manager: import('typeorm').EntityManager) => Promise<T>,
): Promise<T> {
  return getDataSource().transaction(fn);
}
