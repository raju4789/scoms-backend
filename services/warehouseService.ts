import * as warehouseRepository from '../repositories/warehouseRepository';

// You can add business logic here, e.g., validation, orchestration, etc.
export const createWarehouse = warehouseRepository.createWarehouse;
export const getWarehouses = warehouseRepository.getWarehouses;
export const getWarehouseById = warehouseRepository.getWarehouseById;
export const updateWarehouse = warehouseRepository.updateWarehouse;
export const deleteWarehouse = warehouseRepository.deleteWarehouse;
