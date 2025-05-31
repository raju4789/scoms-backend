import { Request, Response, Router } from 'express';
import * as warehouseService from '../services/warehouseService';
import { successResponse } from '../types/CommonApiResponse';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /warehouses
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await warehouseService.getWarehouses();
    res.json(successResponse(result));
  })
);

// GET /warehouses/:id
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await warehouseService.getWarehouseById(Number(req.params.id));
    res.json(successResponse(result));
  })
);

// POST /warehouses
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await warehouseService.createWarehouse(req.body);
    res.json(successResponse(result));
  })
);

// PUT /warehouses/:id
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await warehouseService.updateWarehouse(Number(req.params.id), req.body);
    res.json(successResponse(result));
  })
);

// DELETE /warehouses/:id
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await warehouseService.deleteWarehouse(Number(req.params.id));
    res.json(successResponse(null));
  })
);

export default router;
