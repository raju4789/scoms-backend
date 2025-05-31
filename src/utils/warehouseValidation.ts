import { CreateWarehouseInput, UpdateWarehouseInput } from '../types/OrderServiceTypes';
import { AppError } from '../errors/AppError';

export function validateWarehouseId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Warehouse id must be a positive integer', { name: 'WarehouseValidationError' });
  }
}

export function validateCreateWarehouseInput(data: CreateWarehouseInput): void {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new AppError('Warehouse name is required', { name: 'WarehouseValidationError' });
  }
  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new AppError('Warehouse latitude and longitude are required', { name: 'WarehouseValidationError' });
  }
  if (typeof data.stock !== 'number' || data.stock < 0) {
    throw new AppError('Warehouse stock must be a non-negative number', { name: 'WarehouseValidationError' });
  }
}

export function validateUpdateWarehouseInput(data: UpdateWarehouseInput): void {
  if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
    throw new AppError('Warehouse stock must be a non-negative number', { name: 'WarehouseValidationError' });
  }
}
