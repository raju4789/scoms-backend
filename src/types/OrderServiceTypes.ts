// types/OrderServiceTypes.ts
// Types for order service

/**
 * Input for order verification and submission.
 */
export interface OrderInput {
  quantity: number;
  shipping_latitude: number;
  shipping_longitude: number;
}

/**
 * Result of verifying an order, including pricing and validity.
 */
export interface OrderVerificationResult {
  isValid: boolean;
  totalPrice: number;
  discount: number;
  shippingCost: number;
  reason?: string;
}

/**
 * Result of a successful order submission.
 */
export interface OrderSubmissionResult {
  id: string;
  quantity: number;
  total_price: number;
  discount: number;
  shipping_cost: number;
}

/**
 * Allocation of devices from a warehouse.
 */
export interface Allocation {
  warehouse: string;
  quantity: number;
}

/**
 * Result of allocation and shipping calculation.
 */
export interface AllocationAndShipping {
  allocation: Allocation[];
  totalShippingCost: number;
  isStockSufficient: boolean;
}

/**
 * Input for creating a warehouse.
 */
export interface CreateWarehouseInput {
  name: string;
  latitude: number;
  longitude: number;
  stock: number;
}

/**
 * Input for updating a warehouse.
 */
export interface UpdateWarehouseInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  stock?: number;
}
