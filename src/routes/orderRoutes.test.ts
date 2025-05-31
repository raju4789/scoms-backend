import request from 'supertest';
import express, { Express } from 'express';
import orderRoutes from './orderRoutes';

jest.mock('../services/orderService');
const orderService = require('../services/orderService');

describe('orderRoutes', () => {
  let app: Express;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/orders', orderRoutes);
  });

  afterEach(() => jest.clearAllMocks());

  const mockOrder = {
    id: 'abc',
    quantity: 1,
    shipping_latitude: 10,
    shipping_longitude: 20,
    total_price: 100,
    discount: 0,
    shipping_cost: 10,
    warehouse_allocation: [],
    created_at: new Date('2025-05-31T05:21:18.253Z').toISOString(), // Ensure string for deep equality
  };

  it('GET /api/v1/orders returns all orders', async () => {
    orderService.getOrders.mockResolvedValue([{ ...mockOrder }]);
    const res = await request(app).get('/api/v1/orders');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ ...mockOrder }]);
  });

  it('GET /api/v1/orders/:id returns an order', async () => {
    orderService.getOrderById.mockResolvedValue({ ...mockOrder });
    const res = await request(app).get('/api/v1/orders/abc');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ...mockOrder });
  });

  it('POST /api/v1/orders/verify validates an order', async () => {
    orderService.verifyOrder.mockResolvedValue({ isValid: true, totalPrice: 100, discount: 0, shippingCost: 10 });
    const res = await request(app)
      .post('/api/v1/orders/verify')
      .send({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(true);
  });

  it('POST /api/v1/orders/submit submits an order', async () => {
    orderService.submitOrder.mockResolvedValue({ id: 'abc', quantity: 1, total_price: 100, discount: 0, shipping_cost: 10 });
    const res = await request(app)
      .post('/api/v1/orders/submit')
      .send({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('abc');
  });

  it('POST /api/v1/orders submits an order', async () => {
    orderService.submitOrder.mockResolvedValue({ id: 'abc', quantity: 1, total_price: 100, discount: 0, shipping_cost: 10 });
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('abc');
  });

  it('handles service errors with 500', async () => {
    orderService.getOrderById.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/api/v1/orders/abc');
    expect(res.status).toBe(500);
    expect(res.body.errorDetails.errorMessage).toMatch(/fail/);
  });
});
