import { OrderInput } from '../types/OrderServiceTypes';
import { ValidationError } from '../errors/ErrorTypes';

/**
 * Comprehensive validation for OrderInput
 * Following industry best practices for input validation
 */
export function validateOrderInput(data: unknown): OrderInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body is required and must be an object');
  }
  const input = data as OrderInput;
  const errors: Record<string, string> = {};

  // Validate quantity
  if (input.quantity === undefined || input.quantity === null) {
    errors.quantity = 'Quantity is required';
  } else if (typeof input.quantity !== 'number') {
    errors.quantity = 'Quantity must be a number';
  } else if (!Number.isInteger(input.quantity)) {
    errors.quantity = 'Quantity must be an integer';
  } else if (input.quantity <= 0) {
    errors.quantity = 'Quantity must be positive';
  } else if (input.quantity > 10000) {
    errors.quantity = 'Quantity cannot exceed 10,000 units';
  }

  // Validate shipping_latitude
  if (input.shipping_latitude === undefined || input.shipping_latitude === null) {
    errors.shipping_latitude = 'Shipping latitude is required';
  } else if (typeof input.shipping_latitude !== 'number') {
    errors.shipping_latitude = 'Shipping latitude must be a number';
  } else if (!Number.isFinite(input.shipping_latitude)) {
    errors.shipping_latitude = 'Shipping latitude must be a finite number';
  } else if (input.shipping_latitude < -90 || input.shipping_latitude > 90) {
    errors.shipping_latitude = 'Shipping latitude must be between -90 and 90 degrees';
  }

  // Validate shipping_longitude
  if (input.shipping_longitude === undefined || input.shipping_longitude === null) {
    errors.shipping_longitude = 'Shipping longitude is required';
  } else if (typeof input.shipping_longitude !== 'number') {
    errors.shipping_longitude = 'Shipping longitude must be a number';
  } else if (!Number.isFinite(input.shipping_longitude)) {
    errors.shipping_longitude = 'Shipping longitude must be a finite number';
  } else if (input.shipping_longitude < -180 || input.shipping_longitude > 180) {
    errors.shipping_longitude = 'Shipping longitude must be between -180 and 180 degrees';
  }

  // Check for unexpected fields (optional security measure)
  const allowedFields = ['quantity', 'shipping_latitude', 'shipping_longitude'];
  const unexpectedFields = Object.keys(data).filter((key) => !allowedFields.includes(key));
  if (unexpectedFields.length > 0) {
    errors.unexpectedFields = `Unexpected fields: ${unexpectedFields.join(', ')}`;
  }

  // If there are validation errors, throw them
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Order input validation failed', errors);
  }

  // Return validated and sanitized data
  return {
    quantity: input.quantity,
    shipping_latitude: input.shipping_latitude,
    shipping_longitude: input.shipping_longitude,
  };
}

/**
 * Validate order ID parameter
 */
export function validateOrderId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Order ID is required and must be a string');
  }

  // Validate UUID format (assuming orders use UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Order ID must be a valid UUID');
  }

  return id;
}
