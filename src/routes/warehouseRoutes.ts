import { Response, Router } from 'express';
import * as warehouseService from '../services/warehouseService';
import { successResponse } from '../types/CommonApiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizeRequest, validateRequest, validateRequestFormat } from '../middleware/validation';
import {
  validateCreateWarehouseInput,
  validateUpdateWarehouseInput,
  validateWarehouseParams,
} from '../utils/warehouseValidation';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/AuthTypes';

const router = Router();

// GET /warehouses
router.get(
  '/',
  authMiddleware,
  requirePermission('warehouses:read'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await warehouseService.getWarehouses();
    res.json(successResponse(result));
  }),
);

// GET /warehouses/:id
router.get(
  '/:id',
  authMiddleware,
  requirePermission('warehouses:read'),
  validateRequest(validateWarehouseParams, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = await warehouseService.getWarehouseById(id);
    res.json(successResponse(result));
  }),
);

// POST /warehouses
router.post(
  '/',
  authMiddleware,
  requirePermission('warehouses:write'),
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateCreateWarehouseInput, 'body'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await warehouseService.createWarehouse(req.body);
    res.json(successResponse(result));
  }),
);

// PUT /warehouses/:id
router.put(
  '/:id',
  authMiddleware,
  requirePermission('warehouses:write'),
  validateRequest(validateWarehouseParams, 'params'),
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateUpdateWarehouseInput, 'body'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = await warehouseService.updateWarehouse(id, req.body);
    res.json(successResponse(result));
  }),
);

// DELETE /warehouses/:id
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('warehouses:write'),
  validateRequest(validateWarehouseParams, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    await warehouseService.deleteWarehouse(id);
    res.json(successResponse(null));
  }),
);

export default router;
