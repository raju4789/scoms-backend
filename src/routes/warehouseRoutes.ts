import { Request, Response, Router } from 'express';
import * as warehouseService from '../services/warehouseService';
import { successResponse } from '../types/CommonApiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizeRequest, validateRequest, validateRequestFormat } from '../middleware/validation';
import {
  validateCreateWarehouseInput,
  validateUpdateWarehouseInput,
  validateWarehouseParams,
} from '../utils/warehouseValidation';

const router = Router();

// GET /warehouses
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await warehouseService.getWarehouses();
    res.json(successResponse(result));
  }),
);

// GET /warehouses/:id
router.get(
  '/:id',
  validateRequest(validateWarehouseParams, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await warehouseService.getWarehouseById(id);
    res.json(successResponse(result));
  }),
);

// POST /warehouses
router.post(
  '/',
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateCreateWarehouseInput, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await warehouseService.createWarehouse(req.body);
    res.json(successResponse(result));
  }),
);

// PUT /warehouses/:id
router.put(
  '/:id',
  validateRequest(validateWarehouseParams, 'params'),
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateUpdateWarehouseInput, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await warehouseService.updateWarehouse(id, req.body);
    res.json(successResponse(result));
  }),
);

// DELETE /warehouses/:id
router.delete(
  '/:id',
  validateRequest(validateWarehouseParams, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await warehouseService.deleteWarehouse(id);
    res.json(successResponse(null));
  }),
);

export default router;
