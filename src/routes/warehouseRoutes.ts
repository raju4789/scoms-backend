import { Router, Request, Response, NextFunction } from 'express';
import * as warehouseService from '../services/warehouseService';
import { successResponse, errorResponse } from '../types/CommonApiResponse';
import { AppError } from '../errors/AppError';

const router = Router();

// Async handler utility to avoid repetitive try/catch
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// GET /warehouses
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.getWarehouses();
  res.json(successResponse(result));
}));

// GET /warehouses/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.getWarehouseById(Number(req.params.id));
  res.json(successResponse(result));
}));

// POST /warehouses
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.createWarehouse(req.body);
  res.json(successResponse(result));
}));

// PUT /warehouses/:id
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.updateWarehouse(Number(req.params.id), req.body);
  res.json(successResponse(result));
}));

// DELETE /warehouses/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await warehouseService.deleteWarehouse(Number(req.params.id));
  res.json(successResponse(null));
}));

// Global error handler middleware for warehouseRoutes tests
// (for test express app, not for router export)
// This is only needed in test files, but for completeness, you can add this to the router for direct use in test apps
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json(errorResponse(500, err.message || 'Internal Server Error'));
});

export default router;
