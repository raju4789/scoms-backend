import { CreateWarehouseInput, UpdateWarehouseInput } from '../types/OrderServiceTypes';
import { ValidationError } from '../errors/ErrorTypes';

export function validateWarehouseId(id: string | number): number {
  const numericId = typeof id === 'string' ? Number(id) : id;

  if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError('Warehouse id must be a positive integer');
  }

  return numericId;
}

export function validateCreateWarehouseInput(data: unknown): void {
  const input = data as CreateWarehouseInput;
  // Only allow expected fields
  const allowedFields = ['name', 'latitude', 'longitude', 'stock'];
  const extraFields = Object.keys(input).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    throw new ValidationError(`Unknown field(s) in request: ${extraFields.join(', ')}`);
  }
  if (!input.name || typeof input.name !== 'string' || input.name.trim() === '') {
    throw new ValidationError('Warehouse name is required');
  }
  input.name = input.name.trim();
  if (typeof input.latitude !== 'number' || typeof input.longitude !== 'number') {
    throw new ValidationError('Warehouse latitude and longitude are required');
  }
  if (typeof input.stock !== 'number' || input.stock < 0) {
    throw new ValidationError('Warehouse stock must be a non-negative number');
  }
}

export function validateUpdateWarehouseInput(data: unknown): void {
  const input = data as UpdateWarehouseInput;
  // Only allow expected fields
  const allowedFields = ['name', 'latitude', 'longitude', 'stock'];
  const extraFields = Object.keys(input).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    throw new ValidationError(`Unknown field(s) in request: ${extraFields.join(', ')}`);
  }
  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      throw new ValidationError('Warehouse name must be a non-empty string');
    }
    input.name = input.name.trim();
  }
  if (input.latitude !== undefined && typeof input.latitude !== 'number') {
    throw new ValidationError('Warehouse latitude must be a number');
  }
  if (input.longitude !== undefined && typeof input.longitude !== 'number') {
    throw new ValidationError('Warehouse longitude must be a number');
  }
  if (input.stock !== undefined && (typeof input.stock !== 'number' || input.stock < 0)) {
    throw new ValidationError('Warehouse stock must be a non-negative number');
  }
}

/**
 * Validates warehouse parameters (specifically the ID parameter)
 */
export function validateWarehouseParams(params: unknown): { id: number } {
  const id = validateWarehouseId((params as { id: string | number }).id);
  return { id };
}
