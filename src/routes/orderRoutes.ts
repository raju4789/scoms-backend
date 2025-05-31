import { Router, Request, Response, NextFunction } from 'express';
import * as orderService from '../services/orderService';
import { successResponse, errorResponse } from '../types/CommonApiResponse';

const router = Router();

// Async handler utility for DRY error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// GET /orders
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.getOrders();
  res.json(successResponse(result));
}));

// GET /orders/:id (id is a string/UUID)
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.getOrderById(req.params.id);
  res.json(successResponse(result));
}));

// POST /orders/verify (validate order without creating)
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.verifyOrder(req.body);
  res.json(successResponse(result));
}));

// POST /orders/submit (explicit endpoint for order submission)
router.post('/submit', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.submitOrder(req.body);
  res.json(successResponse(result));
}));

// POST /orders (legacy/alias for submit)
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.submitOrder(req.body);
  res.json(successResponse(result));
}));

// Global error handler middleware for orderRoutes tests
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json(errorResponse(500, err.message || 'Internal Server Error'));
});


export default router;
