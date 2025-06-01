import * as warehouseRepository from './warehouseRepository';
import { Warehouse } from '../models/Warehouse';
import { DatabaseError } from '../errors/ErrorTypes';
import { getDataSource } from '../config/data-source-consul';

jest.mock('../config/data-source-consul');

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDataSource as jest.Mock).mockReturnValue({
    getRepository: jest.fn().mockReturnValue(mockRepo),
  });
});

const validWarehouse: Warehouse = {
  id: 1,
  name: 'A',
  latitude: 0,
  longitude: 0,
  stock: 100,
};

describe('warehouseRepository (unit, with mocks)', () => {
  it('should create a warehouse successfully', async () => {
    mockRepo.create.mockImplementation((d: Partial<Warehouse>) => ({
      ...validWarehouse,
      ...d,
    }));
    mockRepo.save.mockResolvedValue(validWarehouse);
    const data = { name: 'A', stock: 100 } as Partial<Warehouse>;
    await expect(warehouseRepository.createWarehouse(data)).resolves.toEqual({
      ...validWarehouse,
      ...data,
    });
  });

  it('should throw DatabaseError when createWarehouse throws', async () => {
    mockRepo.create.mockImplementation((d: Partial<Warehouse>) => ({
      ...validWarehouse,
      ...d,
    }));
    mockRepo.save.mockRejectedValue(new Error('fail'));
    await expect(warehouseRepository.createWarehouse({} as Partial<Warehouse>)).rejects.toThrow(
      DatabaseError,
    );
  });

  it('should get warehouses (empty array)', async () => {
    mockRepo.find.mockResolvedValue([]);
    await expect(warehouseRepository.getWarehouses()).resolves.toEqual([]);
  });

  it('should throw DatabaseError when getWarehouses throws', async () => {
    mockRepo.find.mockRejectedValue(new Error('fail'));
    await expect(warehouseRepository.getWarehouses()).rejects.toThrow(DatabaseError);
  });

  it('should get warehouse by id if exists', async () => {
    mockRepo.findOneBy.mockImplementation(async (where: Partial<Warehouse>) =>
      where.id === 1 ? validWarehouse : null,
    );
    await expect(warehouseRepository.getWarehouseById(1)).resolves.toEqual(validWarehouse);
  });

  it('should return null if warehouse by id does not exist', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);
    await expect(warehouseRepository.getWarehouseById(999)).resolves.toBeNull();
  });

  it('should update warehouse successfully', async () => {
    mockRepo.update.mockResolvedValue(undefined);
    mockRepo.findOneBy.mockResolvedValue(validWarehouse);
    await expect(warehouseRepository.updateWarehouse(1, { stock: 200 })).resolves.toEqual(
      validWarehouse,
    );
  });

  it('should throw DatabaseError when updateWarehouse throws', async () => {
    mockRepo.update.mockRejectedValue(new Error('fail'));
    await expect(warehouseRepository.updateWarehouse(1, { stock: 200 })).rejects.toThrow(
      DatabaseError,
    );
  });

  it('should delete warehouse successfully', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await expect(warehouseRepository.deleteWarehouse(1)).resolves.toBeUndefined();
  });

  it('should throw DatabaseError when deleteWarehouse throws', async () => {
    mockRepo.delete.mockRejectedValue(new Error('fail'));
    await expect(warehouseRepository.deleteWarehouse(1)).rejects.toThrow(DatabaseError);
  });
});
