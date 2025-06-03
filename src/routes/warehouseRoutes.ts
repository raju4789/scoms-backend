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

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get all warehouses
 *     description: |
 *       Retrieves a list of all warehouses in the system with their current inventory levels
 *       and location information. This endpoint is useful for:
 *       - Displaying warehouse locations on a map
 *       - Checking inventory levels across facilities
 *       - Planning order fulfillment strategies
 *     tags: [Warehouses]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Successfully retrieved warehouses
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
 *                         $ref: '#/components/schemas/Warehouse'
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
  requirePermission('warehouses:read'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await warehouseService.getWarehouses();
    res.json(successResponse(result));
  })
);

/**
 * @swagger
 * /warehouses/{id}:
 *   get:
 *     summary: Get warehouse by ID
 *     description: |
 *       Retrieves detailed information about a specific warehouse including its
 *       current inventory levels and precise location coordinates.
 *     tags: [Warehouses]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique warehouse identifier
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Successfully retrieved warehouse
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Warehouse'
 *       400:
 *         description: Invalid warehouse ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       404:
 *         description: Warehouse not found
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
  requirePermission('warehouses:read'),
  validateRequest(validateWarehouseParams, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = await warehouseService.getWarehouseById(id);
    res.json(successResponse(result));
  })
);

/**
 * @swagger
 * /warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     description: |
 *       Creates a new warehouse facility in the system. The warehouse name must be unique
 *       across all facilities. Location coordinates should be precise to ensure accurate
 *       shipping cost calculations.
 *
 *       ## Validation Rules
 *       - **Name**: Must be unique, 1-100 characters, trimmed of whitespace
 *       - **Latitude**: Must be between -90 and 90 degrees
 *       - **Longitude**: Must be between -180 and 180 degrees
 *       - **Stock**: Must be non-negative integer, maximum 100,000 units
 *     tags: [Warehouses]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWarehouseInput'
 *     responses:
 *       200:
 *         description: Warehouse successfully created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Warehouse'
 *       400:
 *         description: Invalid input or validation failure
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
  '/',
  authMiddleware,
  requirePermission('warehouses:write'),
  validateRequestFormat,
  sanitizeRequest,
  validateRequest(validateCreateWarehouseInput, 'body'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await warehouseService.createWarehouse(req.body);
    res.json(successResponse(result));
  })
);

/**
 * @swagger
 * /warehouses/{id}:
 *   put:
 *     summary: Update warehouse information
 *     description: |
 *       Updates an existing warehouse with new information. All fields are optional,
 *       but at least one field must be provided. The warehouse name must remain unique
 *       if updated.
 *
 *       ## Updatable Fields
 *       - **name**: Warehouse display name (must be unique)
 *       - **latitude**: Latitude coordinate (-90 to 90)
 *       - **longitude**: Longitude coordinate (-180 to 180)
 *       - **stock**: Current inventory level (0 to 100,000)
 *
 *       ## Common Use Cases
 *       - **Stock Adjustments**: Update inventory after receiving shipments
 *       - **Location Corrections**: Fix GPS coordinates for better accuracy
 *       - **Facility Rebranding**: Update warehouse names
 *     tags: [Warehouses]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique warehouse identifier
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - $ref: '#/components/parameters/CorrelationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWarehouseInput'
 *     responses:
 *       200:
 *         description: Warehouse successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Warehouse'
 *       400:
 *         description: Invalid input or validation failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/500'
 */
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
  })
);

/**
 * @swagger
 * /warehouses/{id}:
 *   delete:
 *     summary: Delete a warehouse
 *     description: |
 *       Permanently removes a warehouse from the system. This operation cannot be undone.
 *
 *       ## Important Considerations
 *       - **Inventory Loss**: Any remaining stock will be permanently lost
 *       - **Order Impact**: Active orders allocated to this warehouse may be affected
 *       - **Historical Data**: Past orders referencing this warehouse will retain historical allocation data
 *
 *       ## Safety Recommendations
 *       1. Transfer inventory to other warehouses before deletion
 *       2. Ensure no pending orders are allocated to this facility
 *       3. Consider archiving instead of deletion for audit purposes
 *     tags: [Warehouses]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique warehouse identifier
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 999
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Warehouse successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: 'null'
 *                       description: 'No data returned for successful deletion'
 *       400:
 *         description: Invalid warehouse ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('warehouses:write'),
  validateRequest(validateWarehouseParams, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    await warehouseService.deleteWarehouse(id);
    res.json(successResponse(null));
  })
);

export default router;
