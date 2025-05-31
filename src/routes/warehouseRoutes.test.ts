import request from 'supertest';
import express, { Express } from 'express';
import warehouseRoutes from './warehouseRoutes';
import { errorHandler } from '../middleware/errorHandler';
import { correlationIdMiddleware } from '../middleware/correlationId';

jest.mock('../services/warehouseService');
const warehouseService = require('../services/warehouseService');

describe('warehouseRoutes', () => {
  let app: Express;
  beforeAll(() => {
    app = express();
    app.use(correlationIdMiddleware);
    app.use(express.json());
    app.use('/api/v1/warehouses', warehouseRoutes);
    app.use(errorHandler);
  });

  afterEach(() => jest.clearAllMocks());

  const mockWarehouse = { id: 1, name: 'Main', latitude: 10, longitude: 20, stock: 100 };

  it('GET /api/v1/warehouses returns all warehouses', async () => {
    warehouseService.getWarehouses.mockResolvedValue([mockWarehouse]);
    const res = await request(app).get('/api/v1/warehouses');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([mockWarehouse]);
  });

  it('GET /api/v1/warehouses/:id returns a warehouse', async () => {
    warehouseService.getWarehouseById.mockResolvedValue(mockWarehouse);
    const res = await request(app).get('/api/v1/warehouses/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockWarehouse);
  });

  it('POST /api/v1/warehouses creates a warehouse', async () => {
    warehouseService.createWarehouse.mockResolvedValue(mockWarehouse);
    const res = await request(app)
      .post('/api/v1/warehouses')
      .send({ name: 'Main', latitude: 10, longitude: 20, stock: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockWarehouse);
  });

  it('PUT /api/v1/warehouses/:id updates a warehouse', async () => {
    warehouseService.updateWarehouse.mockResolvedValue(mockWarehouse);
    const res = await request(app)
      .put('/api/v1/warehouses/1')
      .send({ stock: 200 });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockWarehouse);
  });

  it('DELETE /api/v1/warehouses/:id deletes a warehouse', async () => {
    warehouseService.deleteWarehouse.mockResolvedValue(undefined);
    const res = await request(app).delete('/api/v1/warehouses/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('handles service errors with 500', async () => {
    warehouseService.getWarehouseById.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/api/v1/warehouses/1');
    expect(res.status).toBe(500);
    expect(res.body.errorDetails.errorMessage).toMatch(/fail/);
  });
});
