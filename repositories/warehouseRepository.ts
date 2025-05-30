import { AppDataSource } from '../config/data-source';
import { Warehouse } from '../models/Warehouse';
import { AppError } from '../errors/AppError';

export const warehouseRepo = AppDataSource.getRepository(Warehouse);

export const createWarehouse = async (data: Partial<Warehouse>): Promise<Warehouse> => {
  try {
    const warehouse = warehouseRepo.create(data);
    return await warehouseRepo.save(warehouse);
  } catch (error) {
    throw new AppError('Failed to create warehouse', { name: 'WarehouseRepositoryError', cause: error });
  }
};

export const getWarehouses = async (): Promise<Warehouse[]> => {
  try {
    return await warehouseRepo.find();
  } catch (error) {
    throw new AppError('Failed to fetch warehouses', { name: 'WarehouseRepositoryError', cause: error });
  }
};

export const getWarehouseById = async (id: number): Promise<Warehouse | null> => {
  try {
    return await warehouseRepo.findOneBy({ id });
  } catch (error) {
    throw new AppError('Failed to fetch warehouse by id', { name: 'WarehouseRepositoryError', cause: error });
  }
};

export const updateWarehouse = async (id: number, data: Partial<Warehouse>): Promise<Warehouse | null> => {
  try {
    await warehouseRepo.update(id, data);
    return await warehouseRepo.findOneBy({ id });
  } catch (error) {
    throw new AppError('Failed to update warehouse', { name: 'WarehouseRepositoryError', cause: error });
  }
};

export const deleteWarehouse = async (id: number): Promise<void> => {
  try {
    await warehouseRepo.delete(id);
  } catch (error) {
    throw new AppError('Failed to delete warehouse', { name: 'WarehouseRepositoryError', cause: error });
  }
};
