import * as warehouseService from './warehouseService';
import * as warehouseRepository from '../repositories/warehouseRepository';
import { NotFoundError, ValidationError } from '../errors/ErrorTypes';
import { Warehouse } from '../models/Warehouse';
import { CreateWarehouseInput, UpdateWarehouseInput } from '../types/OrderServiceTypes';

jest.mock('../repositories/warehouseRepository');

const mockWarehouse: Warehouse = {
  id: 1,
  name: 'Main',
  latitude: 10,
  longitude: 20,
  stock: 100,
};

describe('warehouseService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createWarehouse', () => {
    it('should create a warehouse with valid input', async () => {
      (warehouseRepository.createWarehouse as jest.Mock).mockResolvedValue(mockWarehouse);
      const input: CreateWarehouseInput = { name: 'Main', latitude: 10, longitude: 20, stock: 100 };
      const result = await warehouseService.createWarehouse(input);
      expect(result).toEqual(mockWarehouse);
    });
    it('should throw if name is missing', async () => {
      const input = { latitude: 10, longitude: 20, stock: 100 } as unknown as CreateWarehouseInput;
      await expect(warehouseService.createWarehouse(input)).rejects.toThrow(ValidationError);
    });
    it('should throw if latitude/longitude are missing', async () => {
      const input = { name: 'Main', stock: 100 } as unknown as CreateWarehouseInput;
      await expect(warehouseService.createWarehouse(input)).rejects.toThrow(ValidationError);
    });
    it('should throw if stock is negative', async () => {
      const input = { name: 'Main', latitude: 10, longitude: 20, stock: -1 };
      await expect(warehouseService.createWarehouse(input)).rejects.toThrow(ValidationError);
    });
    it('should propagate repository errors', async () => {
      (warehouseRepository.createWarehouse as jest.Mock).mockRejectedValue(new Error('fail'));
      const input: CreateWarehouseInput = { name: 'Main', latitude: 10, longitude: 20, stock: 100 };
      await expect(warehouseService.createWarehouse(input)).rejects.toThrow('fail');
    });
  });

  describe('getWarehouses', () => {
    it('should return all warehouses', async () => {
      (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([mockWarehouse]);
      const result = await warehouseService.getWarehouses();
      expect(result).toEqual([mockWarehouse]);
    });
  });

  describe('getWarehouseById', () => {
    it('should return warehouse for valid id', async () => {
      (warehouseRepository.getWarehouseById as jest.Mock).mockResolvedValue(mockWarehouse);
      const result = await warehouseService.getWarehouseById(1);
      expect(result).toEqual(mockWarehouse);
    });
    it('should throw for invalid id', async () => {
      await expect(warehouseService.getWarehouseById(0)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateWarehouse', () => {
    it('should update warehouse with valid input', async () => {
      (warehouseRepository.updateWarehouse as jest.Mock).mockResolvedValue(mockWarehouse);
      const input: UpdateWarehouseInput = { stock: 200 };
      const result = await warehouseService.updateWarehouse(1, input);
      expect(result).toEqual(mockWarehouse);
    });
    it('should throw if id is invalid', async () => {
      await expect(warehouseService.updateWarehouse(0, { stock: 10 })).rejects.toThrow(
        ValidationError
      );
    });
    it('should throw if stock is negative', async () => {
      await expect(warehouseService.updateWarehouse(1, { stock: -5 })).rejects.toThrow(
        ValidationError
      );
    });
    it('should throw if warehouse not found', async () => {
      (warehouseRepository.updateWarehouse as jest.Mock).mockResolvedValue(null);
      await expect(warehouseService.updateWarehouse(1, { stock: 10 })).rejects.toThrow(
        NotFoundError
      );
    });
    it('should propagate repository errors', async () => {
      (warehouseRepository.updateWarehouse as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(warehouseService.updateWarehouse(1, { stock: 10 })).rejects.toThrow('fail');
    });
  });

  describe('deleteWarehouse', () => {
    it('should delete warehouse for valid id', async () => {
      (warehouseRepository.deleteWarehouse as jest.Mock).mockResolvedValue(undefined);
      await expect(warehouseService.deleteWarehouse(1)).resolves.toBeUndefined();
    });
    it('should throw for invalid id', async () => {
      await expect(warehouseService.deleteWarehouse(0)).rejects.toThrow(ValidationError);
    });
    it('should propagate repository errors', async () => {
      (warehouseRepository.deleteWarehouse as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(warehouseService.deleteWarehouse(1)).rejects.toThrow('fail');
    });
  });
});
