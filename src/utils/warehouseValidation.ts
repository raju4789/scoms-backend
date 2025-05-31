import { CreateWarehouseInput, UpdateWarehouseInput } from '../types/OrderServiceTypes';
import { ValidationError } from '../errors/ErrorTypes';

export function validateWarehouseId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Warehouse id must be a positive integer');
  }
}

export function validateCreateWarehouseInput(data: CreateWarehouseInput): void {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new ValidationError('Warehouse name is required');
  }
  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new ValidationError('Warehouse latitude and longitude are required');
  }
  if (typeof data.stock !== 'number' || data.stock < 0) {
    throw new ValidationError('Warehouse stock must be a non-negative number');
  }
}

export function validateUpdateWarehouseInput(data: UpdateWarehouseInput): void {
  if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
    throw new ValidationError('Warehouse stock must be a non-negative number');
  }
}
