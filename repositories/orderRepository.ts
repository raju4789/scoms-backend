import { AppDataSource } from '../config/data-source';
import { Order } from '../models/Order';
import { AppError } from '../errors/AppError';

export const orderRepo = AppDataSource.getRepository(Order);

export const createOrder = async (data: Partial<Order>): Promise<Order> => {
  try {
    const order = orderRepo.create(data);
    return await orderRepo.save(order);
  } catch (error) {
    throw new AppError('Failed to create order', { name: 'OrderRepositoryError', cause: error });
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    return await orderRepo.findOneBy({ id });
  } catch (error) {
    throw new AppError('Failed to fetch order by id', { name: 'OrderRepositoryError', cause: error });
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    return await orderRepo.find();
  } catch (error) {
    throw new AppError('Failed to fetch orders', { name: 'OrderRepositoryError', cause: error });
  }
};
