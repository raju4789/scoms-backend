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
 * Basic health check endpoint
 */
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      service: 'SCOMS Backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(StatusCodes.OK).json(successResponse(health));
  }),
);

/**
 * Detailed health check with dependencies
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
      await consulService.getOrderConfig(); // Simple check to see if Consul is accessible
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
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
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
  }),
);

/**
 * Readiness probe for Kubernetes
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
  }),
);

/**
 * Liveness probe for Kubernetes
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;
