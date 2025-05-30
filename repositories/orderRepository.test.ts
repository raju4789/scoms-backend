import * as orderRepository from './orderRepository';
import { Order, WarehouseAllocation } from '../models/Order';
import { AppError } from '../errors/AppError';
import { AppDataSource } from '../config/data-source';

const orderRepo = AppDataSource.getRepository(Order);

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('orderRepository (unit, with mocks)', () => {
  it('should run a simple test', () => {
    expect(true).toBe(true);
  });

  it('should create an order successfully', async () => {
    (orderRepo.create as any) = jest.fn((d: Partial<Order>) => ({ ...validOrder, ...d }));
    (orderRepo.save as any) = jest.fn(async (order: Order) => order);
    const data = { id: 'exists', quantity: 1 } as Partial<Order>;
    await expect(orderRepository.createOrder(data)).resolves.toEqual({ ...validOrder, ...data });
  });

  it('should throw AppError when createOrder throws', async () => {
    (orderRepo.create as any) = jest.fn((d: Partial<Order>) => ({ ...validOrder, ...d }));
    (orderRepo.save as any) = jest.fn(() => { throw new Error('fail'); });
    await expect(orderRepository.createOrder({} as Partial<Order>)).rejects.toThrow(AppError);
  });

  it('should get order by id if exists', async () => {
    (orderRepo.findOneBy as any) = jest.fn(async (where: Partial<Order>) => (where.id === 'exists' ? validOrder : null));
    await expect(orderRepository.getOrderById('exists')).resolves.toEqual(validOrder);
  });

  it('should return null if order by id does not exist', async () => {
    (orderRepo.findOneBy as any) = jest.fn(async (where: Partial<Order>) => null);
    await expect(orderRepository.getOrderById('notfound')).resolves.toBeNull();
  });

  it('should get orders (empty array)', async () => {
    (orderRepo.find as any) = jest.fn(async () => []);
    await expect(orderRepository.getOrders()).resolves.toEqual([]);
  });

  it('should throw AppError when getOrders throws', async () => {
    (orderRepo.find as any) = jest.fn(() => { throw new Error('fail'); });
    await expect(orderRepository.getOrders()).rejects.toThrow(AppError);
  });
});
