import * as orderRepository from './orderRepository';
import { Order } from '../models/Order';
import { DatabaseError } from '../errors/ErrorTypes';
import { getDataSource } from '../config/data-source-consul';

jest.mock('../config/data-source-consul');

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDataSource as jest.Mock).mockReturnValue({
    getRepository: jest.fn().mockReturnValue(mockRepo),
  });
});

const validOrder: Order = {
  id: 'exists',
  quantity: 1,
  shipping_latitude: 0,
  shipping_longitude: 0,
  total_price: 100,
  discount: 0,
  shipping_cost: 10,
  warehouse_allocation: [{ warehouse: 'A', quantity: 1 }],
  created_at: new Date(),
};

describe('orderRepository (unit, with mocks)', () => {
  it('should run a simple test', () => {
    expect(true).toBe(true);
  });

  it('should create an order successfully', async () => {
    mockRepo.create.mockImplementation((d: Partial<Order>) => ({ ...validOrder, ...d }));
    mockRepo.save.mockResolvedValue(validOrder);
    const data = { id: 'exists', quantity: 1 } as Partial<Order>;
    await expect(orderRepository.createOrder(data)).resolves.toEqual({ ...validOrder, ...data });
  });

  it('should throw DatabaseError when createOrder throws', async () => {
    mockRepo.create.mockImplementation((d: Partial<Order>) => ({ ...validOrder, ...d }));
    mockRepo.save.mockRejectedValue(new Error('fail'));
    await expect(orderRepository.createOrder({} as Partial<Order>)).rejects.toThrow(DatabaseError);
  });

  it('should get order by id if exists', async () => {
    mockRepo.findOneBy.mockImplementation(async (where: Partial<Order>) =>
      where.id === 'exists' ? validOrder : null,
    );
    await expect(orderRepository.getOrderById('exists')).resolves.toEqual(validOrder);
  });

  it('should return null if order by id does not exist', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);
    await expect(orderRepository.getOrderById('notfound')).resolves.toBeNull();
  });

  it('should get orders (empty array)', async () => {
    mockRepo.find.mockResolvedValue([]);
    await expect(orderRepository.getOrders()).resolves.toEqual([]);
  });

  it('should throw DatabaseError when getOrders throws', async () => {
    mockRepo.find.mockRejectedValue(new Error('fail'));
    await expect(orderRepository.getOrders()).rejects.toThrow(DatabaseError);
  });
});
