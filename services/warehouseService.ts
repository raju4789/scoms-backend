import logger from '../utils/logger';
import * as warehouseRepository from '../repositories/warehouseRepository';

// You can add business logic here, e.g., validation, orchestration, etc.
export const createWarehouse = async (data: any) => {
  logger.info('Service: createWarehouse called');
  return warehouseRepository.createWarehouse(data);
};

export const getWarehouses = async () => {
  logger.info('Service: getWarehouses called');
  return warehouseRepository.getWarehouses();
};

export const getWarehouseById = async (id: number) => {
  logger.info('Service: getWarehouseById called');
  return warehouseRepository.getWarehouseById(id);
};

export const updateWarehouse = async (id: number, data: any) => {
  logger.info('Service: updateWarehouse called');
  return warehouseRepository.updateWarehouse(id, data);
};

export const deleteWarehouse = async (id: number) => {
  logger.info('Service: deleteWarehouse called');
  return warehouseRepository.deleteWarehouse(id);
};
