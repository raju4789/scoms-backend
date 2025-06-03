import logger from '../utils/logger';
import * as warehouseRepository from '../repositories/warehouseRepository';
import { NotFoundError } from '../errors/ErrorTypes';
import { Warehouse } from '../models/Warehouse';
import { CreateWarehouseInput, UpdateWarehouseInput } from '../types/OrderServiceTypes';
import { recordError, recordWarehouseOperation } from '../middleware/metrics';
import {
  validateCreateWarehouseInput,
  validateUpdateWarehouseInput,
  validateWarehouseId,
} from '../utils/warehouseValidation';

/**
 * Creates a new warehouse after validating input.
 * @param data - Warehouse creation input
 * @returns The created Warehouse
 * @throws AppError if validation fails
 */
export const createWarehouse = async (data: CreateWarehouseInput): Promise<Warehouse> => {
  logger.info('Service: createWarehouse called', { event: 'createWarehouse', data });
  validateCreateWarehouseInput(data);
  try {
    const warehouse = await warehouseRepository.createWarehouse(data);
    recordWarehouseOperation('create', warehouse.id.toString());
    return warehouse;
  } catch (error) {
    logger.error('Failed to create warehouse', { event: 'createWarehouse', error });
    recordError('warehouse_creation_failed', 'error');
    throw error;
  }
};

/**
 * Retrieves all warehouses.
 * @returns Array of Warehouse
 */
export const getWarehouses = async (): Promise<Warehouse[]> => {
  logger.info('Service: getWarehouses called', { event: 'getWarehouses' });
  return warehouseRepository.getWarehouses();
};

/**
 * Retrieves a warehouse by its ID.
 * @param id - Warehouse ID
 * @returns The Warehouse or null if not found
 * @throws AppError if id is invalid
 */
export const getWarehouseById = async (id: number): Promise<Warehouse | null> => {
  logger.info('Service: getWarehouseById called', { event: 'getWarehouseById', id });
  validateWarehouseId(id);
  return warehouseRepository.getWarehouseById(id);
};

/**
 * Updates a warehouse after validating input.
 * @param id - Warehouse ID
 * @param data - Update input
 * @returns The updated Warehouse
 * @throws AppError if validation fails or warehouse not found
 */
export const updateWarehouse = async (
  id: number,
  data: UpdateWarehouseInput
): Promise<Warehouse> => {
  logger.info('Service: updateWarehouse called', { event: 'updateWarehouse', id, data });
  validateWarehouseId(id);
  validateUpdateWarehouseInput(data);
  try {
    const updated = await warehouseRepository.updateWarehouse(id, data);
    if (!updated) {
      throw new NotFoundError('Warehouse', id.toString());
    }
    return updated;
  } catch (error) {
    logger.error('Failed to update warehouse', { event: 'updateWarehouse', error });
    throw error;
  }
};

/**
 * Deletes a warehouse by its ID.
 * @param id - Warehouse ID
 * @throws AppError if id is invalid
 */
export const deleteWarehouse = async (id: number): Promise<void> => {
  logger.info('Service: deleteWarehouse called', { event: 'deleteWarehouse', id });
  validateWarehouseId(id);
  try {
    await warehouseRepository.deleteWarehouse(id);
  } catch (error) {
    logger.error('Failed to delete warehouse', { event: 'deleteWarehouse', error });
    throw error;
  }
};
