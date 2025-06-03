import { Response, Router } from 'express';
import * as orderService from '../services/orderService';
import { successResponse } from '../types/CommonApiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizeRequest, validateRequest, validateRequestFormat } from '../middleware/validation';
import { validateOrderId, validateOrderInput } from '../utils/orderValidation';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/AuthTypes';

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     description: |
 *       Retrieves a list of all orders in the system. Orders are returned with complete information
 *       including allocation details and pricing breakdown.
 *     tags: [Orders]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Successfully retrieved orders
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('orders:read'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.getOrders();
    res.json(successResponse(result));
  })
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: |
 *       Retrieves a specific order by its unique identifier. Returns complete order information
 *       including warehouse allocation and pricing details.
 *     tags: [Orders]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique order identifier (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Successfully retrieved order
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.get(
  '/:id',
  authMiddleware,
  requirePermission('orders:read'),
  validateRequest((params: unknown) => validateOrderId((params as { id: string }).id), 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.getOrderById(req.params.id);
    res.json(successResponse(result));
  })
);

/**
 * @swagger
 * /orders/verify:
 *   post:
 *     summary: Verify order without creating
 *     description: |
 *       Validates an order and calculates pricing without actually creating the order.
 *       This endpoint is useful for providing real-time pricing and availability
 *       information to users before they commit to placing an order.
 *
 *       ## Pricing Logic
 *       - **Base Price**: Configurable per device pricing from Consul
 *       - **Volume Discounts**: Tiered discount structure based on quantity
 *         - Multiple discount tiers available for different quantity ranges
 *         - Discount percentages are configurable via Consul
 *       - **Shipping**: Distance-based calculation from nearest warehouse
 *       - **Shipping Cap**: Configurable maximum percentage of order total
 *     tags: [Orders]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *           examples:
 *             small_order:
 *               summary: Small order example
 *               value:
 *                 quantity: 5
 *                 shipping_latitude: 40.7128
 *                 shipping_longitude: -74.0060
 *             bulk_order:
 *               summary: Bulk order example
 *               value:
 *                 quantity: 25
 *                 shipping_latitude: 40.7128
 *                 shipping_longitude: -74.0060
 *             large_order:
 *               summary: Large order example
 *               value:
 *                 quantity: 100
 *                 shipping_latitude: 40.7128
 *                 shipping_longitude: -74.0060
 *     responses:
 *       200:
 *         description: Order verification completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OrderVerificationResult'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       500:
 *         $ref: '#/components/responses/500'
 */
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
  })
);

/**
 * @swagger
 * /orders/submit:
 *   post:
 *     summary: Submit a new order
 *     description: |
 *       Creates and submits a new order after validation and pricing calculation.
 *       This endpoint will:
 *       1. Validate the order input
 *       2. Check inventory availability across warehouses
 *       3. Calculate optimal warehouse allocation
 *       4. Apply appropriate discounts
 *       5. Calculate shipping costs
 *       6. Create the order if all validations pass
 *       7. Update warehouse inventory
 *
 *       The order will be automatically allocated across multiple warehouses if needed
 *       to fulfill the requested quantity.
 *     tags: [Orders]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *           examples:
 *             standard_order:
 *               summary: Standard order submission
 *               value:
 *                 quantity: 15
 *                 shipping_latitude: 40.7128
 *                 shipping_longitude: -74.0060
 *             bulk_order:
 *               summary: Bulk order example
 *               value:
 *                 quantity: 25
 *                 shipping_latitude: 34.0522
 *                 shipping_longitude: -118.2437
 *     responses:
 *       200:
 *         description: Order successfully created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Unique identifier for the created order
 *                         quantity:
 *                           type: integer
 *                           description: Number of devices ordered
 *                         total_price:
 *                           type: number
 *                           format: float
 *                           description: Final price after discount, before shipping
 *                         discount:
 *                           type: number
 *                           format: float
 *                           description: Discount amount applied
 *                         shipping_cost:
 *                           type: number
 *                           format: float
 *                           description: Calculated shipping cost
 *       400:
 *         description: Invalid input or business logic violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       500:
 *         $ref: '#/components/responses/500'
 */
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
  })
);

export default router;
