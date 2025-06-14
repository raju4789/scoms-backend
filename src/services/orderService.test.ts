import * as orderService from './orderService';
import * as warehouseRepository from '../repositories/warehouseRepository';
import * as orderUtils from '../utils/orderUtils';
import { AppError, BusinessLogicError } from '../errors/ErrorTypes';
import { OrderInput } from '../types/OrderServiceTypes';
import { Warehouse } from '../models/Warehouse';

jest.mock('../repositories/warehouseRepository');

const mockWarehouses: Warehouse[] = [
  { id: 1, name: 'WH1', latitude: 10, longitude: 20, stock: 15 },
  { id: 2, name: 'WH2', latitude: 15, longitude: 25, stock: 15 },
];

describe('orderService.verifyOrder', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return invalid for quantity <= 0', async () => {
    const input: OrderInput = { quantity: 0, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Quantity must be positive');
  });

  it('should return invalid if no warehouses', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([]);
    const input: OrderInput = { quantity: 1, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('No warehouses available to fulfill the order');
  });

  it('should return invalid if not enough stock', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 1 },
    ]);
    const input: OrderInput = { quantity: 5, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Not enough stock in all warehouses');
  });

  it('should return invalid if shipping cost exceeds 15% of order amount', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 0, longitude: 0, stock: 100 },
    ]);
    // Use a far shipping location to increase shipping cost
    const input: OrderInput = { quantity: 1, shipping_latitude: 90, shipping_longitude: 180 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/Shipping cost exceeds 15%/);
  });

  it('should return valid for a normal order', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue(mockWarehouses);
    const input: OrderInput = { quantity: 2, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(true);
    // Calculate expected values
    // Device price from config: 150 (default), no discount for quantity 2
    // totalPrice = 2 * 150 = 300
    expect(result.totalPrice).toBe(300);
    expect(result.discount).toBe(0);
    // Shipping cost: both warehouses are at (10,20) and (15,25), but closest is (10,20) with stock 15
    // Device weight: 0.365, shipping rate: 0.01, distance to (10,20) is 0km, so shipping cost = 2 * 0.365 * 0 * 0.01 = 0
    expect(result.shippingCost).toBeCloseTo(0, 5);
    expect(result.reason).toBeUndefined();
  });

  it('should handle repository errors gracefully', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockRejectedValue(new Error('DB error'));
    const input: OrderInput = { quantity: 1, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/unknown error/i);
  });
});

describe('orderService.verifyOrder - business logic edge cases', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return invalid if all warehouses have zero stock', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 0 },
      { id: 'w2', name: 'WH2', latitude: 15, longitude: 25, stock: 0 },
    ]);
    const input: OrderInput = { quantity: 1, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Not enough stock in all warehouses');
  });

  it('should return valid if order exactly matches total stock', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 2 },
      { id: 'w2', name: 'WH2', latitude: 15, longitude: 25, stock: 3 },
    ]);
    const input: OrderInput = { quantity: 5, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(true);
  });

  it('should apply discount for bulk order', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue(mockWarehouses);
    const input: OrderInput = { quantity: 25, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.discount).toBeGreaterThan(0);
  });

  it('should round shipping cost to two decimals', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue(mockWarehouses);
    const input: OrderInput = {
      quantity: 2,
      shipping_latitude: 10.12345,
      shipping_longitude: 20.54321,
    };
    const result = await orderService.verifyOrder(input);
    expect(Number(result.shippingCost.toFixed(2))).toBe(result.shippingCost);
  });

  it('should prefer closer warehouse for allocation (indirectly tested by shipping cost)', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 1 },
      { id: 'w2', name: 'WH2', latitude: 10.1, longitude: 20.1, stock: 10 },
    ]);
    const input: OrderInput = { quantity: 2, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(true);
    // The shipping cost should be less than if all were shipped from the farther warehouse
    expect(result.shippingCost).toBeLessThan(2 * 0.365 * 15 * 0.01); // 15km is a large overestimate
  });

  it('should apply the highest discount tier for a very large order', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 1000 },
      { id: 'w2', name: 'WH2', latitude: 15, longitude: 25, stock: 1000 },
    ]);
    const input: OrderInput = { quantity: 300, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    // Highest discount tier is 20% for 250+
    expect(result.discount).toBeCloseTo(300 * 150 * 0.2, 2);
    expect(result.totalPrice).toBeCloseTo(300 * 150 * 0.8, 2);
    expect(result.isValid).toBe(true);
  });

  it('should allocate across multiple warehouses if needed', async () => {
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 1 },
      { id: 'w2', name: 'WH2', latitude: 10.1, longitude: 20.1, stock: 2 },
    ]);
    const input: OrderInput = { quantity: 3, shipping_latitude: 10, shipping_longitude: 20 };
    const result = await orderService.verifyOrder(input);
    expect(result.isValid).toBe(true);
    // Shipping cost should reflect allocation from both warehouses
    expect(result.shippingCost).toBeGreaterThan(0);
  });
});

describe('orderService.submitOrder', () => {
  afterEach(() => jest.clearAllMocks());

  beforeEach(() => {
    jest
      .spyOn(orderUtils, 'runInTransaction')
      .mockImplementation(
        async (cb: (manager: import('typeorm').EntityManager) => Promise<unknown>) =>
          cb({
            getRepository: () => ({ update: jest.fn(), save: jest.fn() }),
          } as unknown as import('typeorm').EntityManager)
      );
  });

  it('should throw BusinessLogicError if verifyOrder fails', async () => {
    jest.spyOn(orderService, 'verifyOrder').mockResolvedValue({
      isValid: false,
      totalPrice: 0,
      discount: 0,
      shippingCost: 0,
      reason: 'Invalid',
    });
    await expect(
      orderService.submitOrder({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 })
    ).rejects.toThrow(BusinessLogicError);
  });

  it('should throw BusinessLogicError if no warehouses in transaction', async () => {
    jest.spyOn(orderService, 'verifyOrder').mockResolvedValue({
      isValid: true,
      totalPrice: 100,
      discount: 0,
      shippingCost: 10,
    });
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([]);
    await expect(
      orderService.submitOrder({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 })
    ).rejects.toThrow(BusinessLogicError);
  });

  it('should throw AppError if stock is insufficient during transaction', async () => {
    jest.spyOn(orderUtils, 'runInTransaction').mockImplementation(async () => {
      throw new AppError('Stock insufficient');
    });
    jest.spyOn(orderService, 'verifyOrder').mockResolvedValue({
      isValid: true,
      totalPrice: 100,
      discount: 0,
      shippingCost: 10,
    });
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 1 },
    ]);
    await expect(
      orderService.submitOrder({ quantity: 5, shipping_latitude: 10, shipping_longitude: 20 })
    ).rejects.toThrow(AppError);
  });

  it('should throw if allocation changes and stock is insufficient during transaction', async () => {
    jest.spyOn(orderUtils, 'runInTransaction').mockImplementation(async () => {
      throw new AppError('Stock insufficient');
    });
    jest.spyOn(orderService, 'verifyOrder').mockResolvedValue({
      isValid: true,
      totalPrice: 100,
      discount: 0,
      shippingCost: 10,
    });
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 0 },
      { id: 'w2', name: 'WH2', latitude: 15, longitude: 25, stock: 0 },
    ]);
    await expect(
      orderService.submitOrder({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 })
    ).rejects.toThrow(AppError);
  });

  it('should throw if warehouse stock is just enough but another transaction depletes it', async () => {
    jest.spyOn(orderUtils, 'runInTransaction').mockImplementation(async () => {
      throw new AppError('Stock depleted');
    });
    jest.spyOn(orderService, 'verifyOrder').mockResolvedValue({
      isValid: true,
      totalPrice: 100,
      discount: 0,
      shippingCost: 10,
    });
    (warehouseRepository.getWarehouses as jest.Mock).mockResolvedValue([
      { id: 'w1', name: 'WH1', latitude: 10, longitude: 20, stock: 1 },
    ]);
    await expect(
      orderService.submitOrder({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 })
    ).rejects.toThrow(AppError);
  });
});
