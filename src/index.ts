import express from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger';
import router from './routes';
import { AppDataSource } from './config/data-source';
import { runInitialDataLoad } from './utils/dbBootstrap';
import { errorHandler, setupGlobalErrorHandlers } from './middleware/errorHandler';
import { correlationIdMiddleware } from './middleware/correlationId';
import { requestLogger } from './middleware/requestLogger';
import healthRoutes from './routes/healthRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Setup global error handlers for unhandled rejections and exceptions
setupGlobalErrorHandlers();

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add correlation ID to all requests
app.use(correlationIdMiddleware);

// Add HTTP request/response logging
app.use(requestLogger);

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check routes (before main router)
app.use(healthRoutes);

// Main API routes
app.use(router);

// Main startup function
async function startServer() {
  try {
    await AppDataSource.initialize();
    logger.info('TypeORM DataSource initialized');
    await runInitialDataLoad();
    logger.info('Initial data loading completed');

    // 404 handler for unmatched routes
    app.use((req, res) => {
      res.status(404).json({
        isSuccess: false,
        data: null,
        errorDetails: {
          errorCode: 404,
          errorMessage: `Route ${req.method} ${req.originalUrl} not found`,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Global error handler middleware (must be last)
    app.use(errorHandler);

    const server = app.listen(port, () => {
      logger.info(`🚀 SCOMS Backend server running on http://localhost:${port}`);
      logger.info(`📊 Health check available at http://localhost:${port}/health`);
      logger.info(`🔍 Detailed health check at http://localhost:${port}/health/detailed`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error({ err }, 'Error during server shutdown');
          process.exit(1);
        }

        try {
          await AppDataSource.destroy();
          logger.info('Database connections closed');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (dbErr) {
          logger.error({ err: dbErr }, 'Error closing database connections');
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer();
