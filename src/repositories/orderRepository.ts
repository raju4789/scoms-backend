import { AppDataSource } from '../config/data-source';
import { Order } from '../models/Order';
import { DatabaseError } from '../errors/ErrorTypes';
import logger from '../utils/logger';

const orderRepo = AppDataSource.getRepository(Order);

export const createOrder = async (data: Partial<Order>): Promise<Order> => {
  try {
    logger.info({ event: 'createOrder', orderData: data }, 'Creating new order');
    const order: Order = orderRepo.create(data);
    const savedOrder: Order = await orderRepo.save(order);
    logger.info({ event: 'createOrder', orderId: savedOrder.id }, 'Order created successfully');
    return savedOrder;
  } catch (error: unknown) {
    logger.error(
      {
        event: 'createOrder',
        error: error instanceof Error ? error.message : error,
        orderData: data,
      },
      'Failed to create order'
    );
    throw new DatabaseError(
      'createOrder',
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    logger.info({ event: 'getOrderById', orderId: id }, 'Fetching order by id');
    const order: Order | null = await orderRepo.findOneBy({ id });
    logger.info({ event: 'getOrderById', orderId: id, found: !!order }, 'Order fetch result');
    return order;
  } catch (error: unknown) {
    logger.error(
      { event: 'getOrderById', error: error instanceof Error ? error.message : error, orderId: id },
      'Failed to fetch order by id'
    );
    throw new DatabaseError(
      'getOrderById',
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    logger.info({ event: 'getOrders' }, 'Fetching all orders');
    const orders: Order[] = await orderRepo.find();
    logger.info({ event: 'getOrders', count: orders.length }, 'Fetched orders');
    return orders;
  } catch (error: unknown) {
    logger.error(
      { event: 'getOrders', error: error instanceof Error ? error.message : error },
      'Failed to fetch orders'
    );
    throw new DatabaseError(
      'getOrders',
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
};
