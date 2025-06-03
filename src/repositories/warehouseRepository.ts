import { getDataSource } from '../config/data-source-consul';
import { Warehouse } from '../models/Warehouse';
import { DatabaseError } from '../errors/ErrorTypes';
import logger from '../utils/logger';

// Get repository from the Consul-enabled DataSource
const getWarehouseRepo = () => getDataSource().getRepository(Warehouse);

export const createWarehouse = async (data: Partial<Warehouse>): Promise<Warehouse> => {
  try {
    logger.info('Creating new warehouse', { data });
    const warehouseRepo = getWarehouseRepo();
    const warehouse = warehouseRepo.create(data);
    const savedWarehouse = await warehouseRepo.save(warehouse);
    logger.info('Warehouse created successfully', { warehouseId: savedWarehouse.id });
    return savedWarehouse;
  } catch (error) {
    logger.error('Failed to create warehouse', { error, data });
    throw new DatabaseError('create warehouse', error as Error);
  }
};

export const getWarehouses = async (): Promise<Warehouse[]> => {
  try {
    logger.info('Fetching all warehouses');
    const warehouseRepo = getWarehouseRepo();
    const warehouses = await warehouseRepo.find();
    logger.info('Fetched warehouses', { count: warehouses.length });
    return warehouses;
  } catch (error) {
    logger.error('Failed to fetch warehouses', { error });
    throw new DatabaseError('fetch warehouses', error as Error);
  }
};

export const getWarehouseById = async (id: number): Promise<Warehouse | null> => {
  try {
    logger.info('Fetching warehouse by id', { id });
    const warehouseRepo = getWarehouseRepo();
    const warehouse = await warehouseRepo.findOneBy({ id });
    logger.info('Warehouse fetch result', { id, found: !!warehouse });
    return warehouse;
  } catch (error) {
    logger.error('Failed to fetch warehouse by id', { error, id });
    throw new DatabaseError('fetch warehouse by id', error as Error);
  }
};

export const updateWarehouse = async (
  id: number,
  data: Partial<Warehouse>
): Promise<Warehouse | null> => {
  try {
    logger.info('Updating warehouse', { id, data });
    const warehouseRepo = getWarehouseRepo();
    await warehouseRepo.update(id, data);
    const updatedWarehouse = await warehouseRepo.findOneBy({ id });
    logger.info('Warehouse update result', { id, updated: !!updatedWarehouse });
    return updatedWarehouse;
  } catch (error) {
    logger.error('Failed to update warehouse', { error, id, data });
    throw new DatabaseError('update warehouse', error as Error);
  }
};

export const deleteWarehouse = async (id: number): Promise<void> => {
  try {
    logger.info('Deleting warehouse', { id });
    const warehouseRepo = getWarehouseRepo();
    await warehouseRepo.delete(id);
    logger.info('Warehouse deleted', { id });
  } catch (error) {
    logger.error('Failed to delete warehouse', { error, id });
    throw new DatabaseError('delete warehouse', error as Error);
  }
};
