import { CreateWarehouseInput, UpdateWarehouseInput } from '../types/OrderServiceTypes';
import { ValidationError } from '../errors/ErrorTypes';

export function validateWarehouseId(id: string | number): number {
  const numericId = typeof id === 'string' ? Number(id) : id;

  if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError('Warehouse id must be a positive integer');
  }

  return numericId;
}

export function validateCreateWarehouseInput(data: CreateWarehouseInput): void {
  // Only allow expected fields
  const allowedFields = ['name', 'latitude', 'longitude', 'stock'];
  const extraFields = Object.keys(data).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    throw new ValidationError(`Unknown field(s) in request: ${extraFields.join(', ')}`);
  }
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new ValidationError('Warehouse name is required');
  }
  data.name = data.name.trim();
  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new ValidationError('Warehouse latitude and longitude are required');
  }
  if (typeof data.stock !== 'number' || data.stock < 0) {
    throw new ValidationError('Warehouse stock must be a non-negative number');
  }
}

export function validateUpdateWarehouseInput(data: UpdateWarehouseInput): void {
  // Only allow expected fields
  const allowedFields = ['name', 'latitude', 'longitude', 'stock'];
  const extraFields = Object.keys(data).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    throw new ValidationError(`Unknown field(s) in request: ${extraFields.join(', ')}`);
  }
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      throw new ValidationError('Warehouse name must be a non-empty string');
    }
    data.name = data.name.trim();
  }
  if (data.latitude !== undefined && typeof data.latitude !== 'number') {
    throw new ValidationError('Warehouse latitude must be a number');
  }
  if (data.longitude !== undefined && typeof data.longitude !== 'number') {
    throw new ValidationError('Warehouse longitude must be a number');
  }
  if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
    throw new ValidationError('Warehouse stock must be a non-negative number');
  }
}

/**
 * Validates warehouse parameters (specifically the ID parameter)
 */
export function validateWarehouseParams(params: any): { id: number } {
  const id = validateWarehouseId(params.id);
  return { id };
}
