import { AppDataSource } from '../config/data-source';
import { Warehouse } from '../models/Warehouse';
import { DatabaseError } from '../errors/ErrorTypes';
import logger from '../utils/logger';

// Always use the singleton AppDataSource instance
const warehouseRepo = AppDataSource.getRepository(Warehouse);

export const createWarehouse = async (data: Partial<Warehouse>): Promise<Warehouse> => {
  try {
    logger.info({ data }, 'Creating new warehouse');
    const warehouse = warehouseRepo.create(data);
    const savedWarehouse = await warehouseRepo.save(warehouse);
    logger.info({ warehouseId: savedWarehouse.id }, 'Warehouse created successfully');
    return savedWarehouse;
  } catch (error) {
    logger.error({ error, data }, 'Failed to create warehouse');
    throw new DatabaseError('create warehouse', error as Error);
  }
};

export const getWarehouses = async (): Promise<Warehouse[]> => {
  try {
    logger.info('Fetching all warehouses');
    const warehouses = await warehouseRepo.find();
    logger.info({ count: warehouses.length }, 'Fetched warehouses');
    return warehouses;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch warehouses');
    throw new DatabaseError('fetch warehouses', error as Error);
  }
};

export const getWarehouseById = async (id: number): Promise<Warehouse | null> => {
  try {
    logger.info({ id }, 'Fetching warehouse by id');
    const warehouse = await warehouseRepo.findOneBy({ id });
    logger.info({ id, found: !!warehouse }, 'Warehouse fetch result');
    return warehouse;
  } catch (error) {
    logger.error({ error, id }, 'Failed to fetch warehouse by id');
    throw new DatabaseError('fetch warehouse by id', error as Error);
  }
};

export const updateWarehouse = async (
  id: number,
  data: Partial<Warehouse>
): Promise<Warehouse | null> => {
  try {
    logger.info({ id, data }, 'Updating warehouse');
    await warehouseRepo.update(id, data);
    const updatedWarehouse = await warehouseRepo.findOneBy({ id });
    logger.info({ id, updated: !!updatedWarehouse }, 'Warehouse update result');
    return updatedWarehouse;
  } catch (error) {
    logger.error({ error, id, data }, 'Failed to update warehouse');
    throw new DatabaseError('update warehouse', error as Error);
  }
};

export const deleteWarehouse = async (id: number): Promise<void> => {
  try {
    logger.info({ id }, 'Deleting warehouse');
    await warehouseRepo.delete(id);
    logger.info({ id }, 'Warehouse deleted');
  } catch (error) {
    logger.error({ error, id }, 'Failed to delete warehouse');
    throw new DatabaseError('delete warehouse', error as Error);
  }
};
