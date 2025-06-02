import request from 'supertest';
import express, { Express } from 'express';
import orderRoutes from './orderRoutes';
import { errorHandler } from '../middleware/errorHandler';
import { correlationIdMiddleware } from '../middleware/correlationId';

jest.mock('../services/orderService');
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: unknown, res: unknown, next: () => void) => next(),
  requirePermission: () => (req: unknown, res: unknown, next: () => void) => next(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const orderService = require('../services/orderService');

describe('orderRoutes', () => {
  let app: Express;
  beforeAll(() => {
    app = express();
    app.use(correlationIdMiddleware);
    app.use(express.json());
    app.use('/api/v1/orders', orderRoutes);
    app.use(errorHandler);
  });

  afterEach(() => jest.clearAllMocks());

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const mockOrder = {
    id: validUuid,
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
    const res = await request(app).get(`/api/v1/orders/${validUuid}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ...mockOrder });
  });

  it('POST /api/v1/orders/verify validates an order', async () => {
    orderService.verifyOrder.mockResolvedValue({
      isValid: true,
      totalPrice: 100,
      discount: 0,
      shippingCost: 10,
    });
    const res = await request(app)
      .post('/api/v1/orders/verify')
      .send({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(true);
  });

  it('POST /api/v1/orders/submit submits an order', async () => {
    orderService.submitOrder.mockResolvedValue({
      id: 'abc',
      quantity: 1,
      total_price: 100,
      discount: 0,
      shipping_cost: 10,
    });
    const res = await request(app)
      .post('/api/v1/orders/submit')
      .send({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('abc');
  });

  it('POST /api/v1/orders/verify rejects unknown fields', async () => {
    const res = await request(app)
      .post('/api/v1/orders/verify')
      .send({ quantity: 1, shipping_latitude: 10, shipping_longitude: 20, extra: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.errorDetails.errorMessage).toMatch(/order input validation failed/i);
    expect(res.body.errorDetails.details.unexpectedFields).toMatch(/unexpected fields/i);
  });

  it('POST /api/v1/orders/verify rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/orders/verify')
      .send({ shipping_latitude: 10, shipping_longitude: 20 });
    expect(res.status).toBe(400);
    expect(res.body.errorDetails.errorMessage).toMatch(/order input validation failed/i);
    expect(res.body.errorDetails.details.quantity).toMatch(/quantity is required/i);
  });

  it('POST /api/v1/orders/verify rejects invalid field types', async () => {
    const res = await request(app)
      .post('/api/v1/orders/verify')
      .send({ quantity: 'one', shipping_latitude: 'ten', shipping_longitude: 20 });
    expect(res.status).toBe(400);
    expect(res.body.errorDetails.errorMessage).toMatch(/order input validation failed/i);
    expect(res.body.errorDetails.details.quantity).toMatch(/must be a number/i);
    expect(res.body.errorDetails.details.shipping_latitude).toMatch(/must be a number/i);
  });

  it('GET /api/v1/orders/:id rejects invalid order id', async () => {
    const res = await request(app).get('/api/v1/orders/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.errorDetails.errorMessage).toMatch(/must be a valid uuid|must be a string/i);
  });

  it('handles service errors with 500', async () => {
    orderService.getOrderById.mockRejectedValue(new Error('fail'));
    const res = await request(app).get(`/api/v1/orders/${validUuid}`);
    expect(res.status).toBe(500);
    expect(res.body.errorDetails.errorMessage).toMatch(/fail/);
  });
});
