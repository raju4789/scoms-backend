import { getDataSource } from '../config/data-source-consul';
import { Order } from '../models/Order';
import { DatabaseError } from '../errors/ErrorTypes';
import logger from '../utils/logger';

// Get repository from the Consul-enabled DataSource
const getOrderRepo = () => getDataSource().getRepository(Order);

export const createOrder = async (data: Partial<Order>): Promise<Order> => {
  try {
    logger.info('Creating new order', { event: 'createOrder', orderData: data });
    const orderRepo = getOrderRepo();
    const order: Order = orderRepo.create(data);
    const savedOrder: Order = await orderRepo.save(order);
    logger.info('Order created successfully', { event: 'createOrder', orderId: savedOrder.id });
    return savedOrder;
  } catch (error: unknown) {
    logger.error('Failed to create order', {
      event: 'createOrder',
      error: error instanceof Error ? error.message : error,
      orderData: data,
    });
    throw new DatabaseError(
      'createOrder',
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    logger.info('Fetching order by id', { event: 'getOrderById', orderId: id });
    const orderRepo = getOrderRepo();
    const order: Order | null = await orderRepo.findOneBy({ id });
    logger.info('Order fetch result', { event: 'getOrderById', orderId: id, found: !!order });
    return order;
  } catch (error: unknown) {
    logger.error('Failed to fetch order by id', {
      event: 'getOrderById',
      error: error instanceof Error ? error.message : error,
      orderId: id,
    });
    throw new DatabaseError(
      'getOrderById',
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    logger.info('Fetching all orders', { event: 'getOrders' });
    const orderRepo = getOrderRepo();
    const orders: Order[] = await orderRepo.find();
    logger.info('Fetched orders', { event: 'getOrders', count: orders.length });
    return orders;
  } catch (error: unknown) {
    logger.error('Failed to fetch orders', {
      event: 'getOrders',
      error: error instanceof Error ? error.message : error,
    });
    throw new DatabaseError(
      'getOrders',
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
};
