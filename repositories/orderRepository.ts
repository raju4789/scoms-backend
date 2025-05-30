import { AppDataSource } from '../config/data-source';
import { Order } from '../models/Order';
import { AppError } from '../errors/AppError';
import logger from '../utils/logger';

export const orderRepo = AppDataSource.getRepository(Order);

export const createOrder = async (data: Partial<Order>): Promise<Order> => {
  try {
    logger.info({ data }, 'Creating new order');
    const order = orderRepo.create(data);
    const savedOrder = await orderRepo.save(order);
    logger.info({ orderId: savedOrder.id }, 'Order created successfully');
    return savedOrder;
  } catch (error) {
    logger.error({ error, data }, 'Failed to create order');
    throw new AppError('Failed to create order', { name: 'OrderRepositoryError', cause: error });
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    logger.info({ id }, 'Fetching order by id');
    const order = await orderRepo.findOneBy({ id });
    logger.info({ id, found: !!order }, 'Order fetch result');
    return order;
  } catch (error) {
    logger.error({ error, id }, 'Failed to fetch order by id');
    throw new AppError('Failed to fetch order by id', { name: 'OrderRepositoryError', cause: error });
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    logger.info('Fetching all orders');
    const orders = await orderRepo.find();
    logger.info({ count: orders.length }, 'Fetched orders');
    return orders;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch orders');
    throw new AppError('Failed to fetch orders', { name: 'OrderRepositoryError', cause: error });
  }
};
