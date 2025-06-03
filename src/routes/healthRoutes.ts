import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getDataSource } from '../config/data-source-consul';
import consulService from '../config/consul';
import { ErrorMetricsService } from '../services/errorMetricsService';
import { successResponse } from '../types/CommonApiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: |
 *       Performs a basic health check of the SCOMS service. This endpoint provides
 *       a quick overview of service status without detailed dependency checks.
 *       Ideal for load balancer health checks and basic monitoring.
 *     tags: [Health]
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthStatus'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      service: 'SCOMS Backend',
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
    };

    res.status(StatusCodes.OK).json(successResponse(health));
  })
);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with dependencies
 *     description: |
 *       Performs a comprehensive health check including all service dependencies
 *       and system metrics. This endpoint provides detailed information about:
 *
 *       - **Database connectivity** and response times
 *       - **Consul configuration service** status
 *       - **Error metrics** and service health trends
 *       - **System resources** (memory, CPU, uptime)
 *       - **Overall service status** based on all dependencies
 *
 *       ## Health Status Levels
 *       - **healthy**: All systems operational
 *       - **degraded**: Some systems experiencing issues but service functional
 *       - **unhealthy**: Critical systems down, service may be impaired
 *     tags: [Health]
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Detailed health information (service may be degraded)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DetailedHealthStatus'
 *       503:
 *         description: Service is unhealthy - critical dependencies unavailable
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DetailedHealthStatus'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.get(
  '/health/detailed',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const errorMetrics = ErrorMetricsService.getInstance();

    // Check database connectivity
    let databaseStatus = 'healthy';
    let databaseLatency = 0;

    try {
      const dbStart = Date.now();
      await getDataSource().query('SELECT 1');
      databaseLatency = Date.now() - dbStart;

      if (databaseLatency > 1000) {
        databaseStatus = 'degraded';
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      logger.error('Database connection failed', err);
      databaseStatus = 'unhealthy';
    }

    // Check Consul health
    let consulStatus = 'healthy';
    let consulLatency = 0;

    try {
      const consulStart = Date.now();
      consulService.getOrderConfig(); // Simple check to see if Consul is accessible
      consulLatency = Date.now() - consulStart;

      if (consulLatency > 1000) {
        consulStatus = 'degraded';
      }
    } catch (err) {
      logger.error('Consul connection failed', err);
      consulStatus = 'unhealthy - using fallback configuration';
    }

    // Get error statistics
    const errorStats = errorMetrics.getErrorStats();

    // Calculate overall health status
    let overallStatus = 'healthy';
    if (
      databaseStatus === 'unhealthy' ||
      errorStats.healthStatus === 'unhealthy' ||
      consulStatus.includes('unhealthy')
    ) {
      overallStatus = 'unhealthy';
    } else if (
      databaseStatus === 'degraded' ||
      errorStats.healthStatus === 'degraded' ||
      consulStatus === 'degraded'
    ) {
      overallStatus = 'degraded';
    }

    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      service: 'SCOMS Backend',
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      responseTime: Date.now() - startTime,
      dependencies: {
        database: {
          status: databaseStatus,
          latency: databaseLatency,
          type: 'PostgreSQL',
        },
        consul: {
          status: consulStatus,
          latency: consulLatency,
          type: 'Configuration Management',
        },
      },
      metrics: {
        errors: errorStats,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
      },
    };

    const statusCode =
      overallStatus === 'healthy' ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(successResponse(health));
  })
);

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Kubernetes readiness probe
 *     description: |
 *       Kubernetes readiness probe endpoint that checks if the service is ready to accept traffic.
 *       This endpoint specifically validates database connectivity as it's critical for service operation.
 *
 *       ## Readiness vs Liveness
 *       - **Readiness**: Can the service handle requests? (this endpoint)
 *       - **Liveness**: Is the service running? (see /live endpoint)
 *
 *       Kubernetes will remove the pod from service if readiness fails.
 *     tags: [Health]
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                   description: "Ready status indicator"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-02T12:00:00.000Z"
 *                   description: "Check timestamp"
 *       503:
 *         description: Service is not ready - database unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not ready"
 *                   description: "Not ready status indicator"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-02T12:00:00.000Z"
 *                   description: "Check timestamp"
 *                 reason:
 *                   type: string
 *                   example: "Database not available"
 *                   description: "Reason for not being ready"
 */
router.get(
  '/ready',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if database is ready
      await getDataSource().query('SELECT 1');

      res.status(StatusCodes.OK).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Database readiness check failed', error);
      // Error is not used but we need the catch block
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not available',
      });
    }
  })
);

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Kubernetes liveness probe
 *     description: |
 *       Kubernetes liveness probe endpoint that indicates whether the service is running.
 *       This is a simple endpoint that always returns success if the process is alive.
 *
 *       ## Liveness vs Readiness
 *       - **Liveness**: Is the service running? (this endpoint)
 *       - **Readiness**: Can the service handle requests? (see /ready endpoint)
 *
 *       Kubernetes will restart the pod if liveness fails.
 *     tags: [Health]
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Service is alive and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                   description: "Alive status indicator"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-02T12:00:00.000Z"
 *                   description: "Check timestamp"
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;
