import { Request, Response, Router } from 'express';
import * as orderService from '../services/orderService';
import { successResponse } from '../types/CommonApiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizeRequest, validateRequest, validateRequestFormat } from '../middleware/validation';
import { validateOrderId, validateOrderInput } from '../utils/orderValidation';

const router = Router();

// GET /orders
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.getOrders();
    res.json(successResponse(result));
  }),
);

// GET /orders/:id (id is a string/UUID)
router.get(
  '/:id',
  validateRequest((params) => validateOrderId(params.id), 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.getOrderById(req.params.id);
    res.json(successResponse(result));
  }),
);

// POST /orders/verify (validate order without creating)
router.post(
  '/verify',
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateOrderInput, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.verifyOrder(req.body);
    res.json(successResponse(result));
  }),
);

// POST /orders/submit (explicit endpoint for order submission)
router.post(
  '/submit',
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateOrderInput, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.submitOrder(req.body);
    res.json(successResponse(result));
  }),
);

// POST /orders (legacy/alias for submit)
router.post(
  '/',
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateOrderInput, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.submitOrder(req.body);
    res.json(successResponse(result));
  }),
);

export default router;
