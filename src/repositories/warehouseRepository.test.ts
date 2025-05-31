import * as warehouseRepository from './warehouseRepository';
import { Warehouse } from '../models/Warehouse';
import { DatabaseError } from '../errors/ErrorTypes';
import { AppDataSource } from '../config/data-source';

const warehouseRepo = AppDataSource.getRepository(Warehouse);

const validWarehouse: Warehouse = {
  id: 1,
  name: 'A',
  latitude: 0,
  longitude: 0,
  stock: 100,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('warehouseRepository (unit, with mocks)', () => {
  it('should create a warehouse successfully', async () => {
    (warehouseRepo.create as any) = jest.fn((d: Partial<Warehouse>) => ({ ...validWarehouse, ...d }));
    (warehouseRepo.save as any) = jest.fn(async (warehouse: Warehouse) => warehouse);
    const data = { name: 'A', stock: 100 } as Partial<Warehouse>;
    await expect(warehouseRepository.createWarehouse(data)).resolves.toEqual({ ...validWarehouse, ...data });
  });

  it('should throw DatabaseError when createWarehouse throws', async () => {
    (warehouseRepo.create as any) = jest.fn((d: Partial<Warehouse>) => ({ ...validWarehouse, ...d }));
    (warehouseRepo.save as any) = jest.fn(() => { throw new Error('fail'); });
    await expect(warehouseRepository.createWarehouse({} as Partial<Warehouse>)).rejects.toThrow(DatabaseError);
  });

  it('should get warehouses (empty array)', async () => {
    (warehouseRepo.find as any) = jest.fn(async () => []);
    await expect(warehouseRepository.getWarehouses()).resolves.toEqual([]);
  });

  it('should throw DatabaseError when getWarehouses throws', async () => {
    (warehouseRepo.find as any) = jest.fn(() => { throw new Error('fail'); });
    await expect(warehouseRepository.getWarehouses()).rejects.toThrow(DatabaseError);
  });

  it('should get warehouse by id if exists', async () => {
    (warehouseRepo.findOneBy as any) = jest.fn(async (where: Partial<Warehouse>) => (where.id === 1 ? validWarehouse : null));
    await expect(warehouseRepository.getWarehouseById(1)).resolves.toEqual(validWarehouse);
  });

  it('should return null if warehouse by id does not exist', async () => {
    (warehouseRepo.findOneBy as any) = jest.fn(async (where: Partial<Warehouse>) => null);
    await expect(warehouseRepository.getWarehouseById(999)).resolves.toBeNull();
  });

  it('should update warehouse successfully', async () => {
    (warehouseRepo.update as any) = jest.fn(async () => undefined);
    (warehouseRepo.findOneBy as any) = jest.fn(async (where: Partial<Warehouse>) => validWarehouse);
    await expect(warehouseRepository.updateWarehouse(1, { stock: 200 })).resolves.toEqual(validWarehouse);
  });

  it('should throw DatabaseError when updateWarehouse throws', async () => {
    (warehouseRepo.update as any) = jest.fn(() => { throw new Error('fail'); });
    await expect(warehouseRepository.updateWarehouse(1, { stock: 200 })).rejects.toThrow(DatabaseError);
  });

  it('should delete warehouse successfully', async () => {
    (warehouseRepo.delete as any) = jest.fn(async () => undefined);
    await expect(warehouseRepository.deleteWarehouse(1)).resolves.toBeUndefined();
  });

  it('should throw DatabaseError when deleteWarehouse throws', async () => {
    (warehouseRepo.delete as any) = jest.fn(() => { throw new Error('fail'); });
    await expect(warehouseRepository.deleteWarehouse(1)).rejects.toThrow(DatabaseError);
  });
});
