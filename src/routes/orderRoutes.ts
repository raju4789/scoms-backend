import { Response, Router } from 'express';
import * as orderService from '../services/orderService';
import { successResponse } from '../types/CommonApiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizeRequest, validateRequest, validateRequestFormat } from '../middleware/validation';
import { validateOrderId, validateOrderInput } from '../utils/orderValidation';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/AuthTypes';

const router = Router();

// GET /orders
router.get(
  '/',
  authMiddleware,
  requirePermission('orders:read'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.getOrders();
    res.json(successResponse(result));
  }),
);

// GET /orders/:id (id is a string/UUID)
router.get(
  '/:id',
  authMiddleware,
  requirePermission('orders:read'),
  validateRequest((params: unknown) => validateOrderId((params as { id: string }).id), 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.getOrderById(req.params.id);
    res.json(successResponse(result));
  }),
);

// POST /orders/verify (validate order without creating)
router.post(
  '/verify',
  authMiddleware,
  requirePermission('orders:read'),
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateOrderInput, 'body'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.verifyOrder(req.body);
    res.json(successResponse(result));
  }),
);

// POST /orders/submit (explicit endpoint for order submission)
router.post(
  '/submit',
  authMiddleware,
  requirePermission('orders:write'),
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateOrderInput, 'body'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.submitOrder(req.body);
    res.json(successResponse(result));
  }),
);

export default router;
