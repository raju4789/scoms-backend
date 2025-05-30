import logger from '../utils/logger';
import * as orderRepository from '../repositories/orderRepository';

export const createOrder = async (data: any) => {
  logger.info('Service: createOrder called');
  return orderRepository.createOrder(data);
};

export const getOrderById = async (id: string) => {
  logger.info('Service: getOrderById called');
  return orderRepository.getOrderById(id);
};

export const getOrders = async () => {
  logger.info('Service: getOrders called');
  return orderRepository.getOrders();
};
