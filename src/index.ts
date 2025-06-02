import express from 'express';
import * as dotenv from 'dotenv';
import logger from './utils/logger';
import { closeDataSource, initializeDataSource } from './config/data-source-consul';
import consulService from './config/consul';
import { correlationIdMiddleware } from './middleware/correlationId';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { metricsHandler, metricsMiddleware } from './middleware/metrics';
import authService from './services/authService';
import routes from './routes';
import { runInitialDataLoad } from './utils/dbBootstrap';
import { preloadConsulConfig } from './utils/consulBootstrap';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  try {
    // 1. Preload Consul config based on environment
    const environment = process.env.NODE_ENV || 'development';
    logger.info(`Preloading Consul configuration for ${environment} environment...`);

    // Use unified bootstrap for both environments (preferred approach)
    await preloadConsulConfig();

    // 2. Initialize Consul service
    logger.info('Initializing Consul service...');
    await consulService.initialize();

    // 2.1. Initialize authentication service
    logger.info('Initializing authentication service...');
    await authService.initialize();

    // 3. Initialize database with Consul configuration
    logger.info('Initializing database connection...');
    await initializeDataSource();

    // 4. Run initial data load (seed warehouses if needed)
    logger.info('Running initial data load...');
    await runInitialDataLoad();

    // 5. Get server configuration from Consul
    const serverConfig = consulService.getServerConfig();
    const port = serverConfig.port;

    // 6. Create Express application
    const app = express();

    // 7. Apply middleware
    app.use(correlationIdMiddleware);
    app.use(requestLogger);
    app.use(metricsMiddleware);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // 8. Health check endpoints
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        consulConnected: consulService.isConsulConnected(),
      });
    });

    app.get('/health/ready', async (req, res) => {
      try {
        const isConsulHealthy = consulService.isConsulConnected();
        res.json({
          status: 'ready',
          consul: isConsulHealthy,
          database: true, // We'll assume DB is healthy if we got this far
          timestamp: new Date().toISOString(),
        });
      } catch {
        res.status(503).json({
          status: 'not ready',
          error: 'Service health check failed',
        });
      }
    });

    // 8.1. Metrics endpoint
    app.get('/metrics', metricsHandler);

    // 9. API routes (authentication middleware is applied per route group)
    app.use('/api/v1', routes);

    // 10. Root endpoint
    app.get('/', (req, res) => {
      res.json({
        message: 'ScreenCloud Order Management System API',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        consulUI: 'http://localhost:8500/ui/',
      });
    });

    // 11. Error handling middleware (must be last)
    app.use(errorHandler);

    // 12. Start server
    const server = app.listen(port, () => {
      logger.info(`🚀 SCOMS API Server started successfully`, {
        port,
        environment: process.env.NODE_ENV,
        consulUI: 'http://localhost:8500/ui/',
        apiBase: `http://localhost:${port}/api/v1`,
      });
    });

    // 13. Graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));
  } catch {
    logger.error('Failed to start server');
    await gracefulShutdown();
    process.exit(1);
  }
}

async function gracefulShutdown(server?: import('http').Server): Promise<void> {
  logger.info('Graceful shutdown initiated...');

  try {
    if (server) {
      server.close();
      logger.info('HTTP server closed');
    }

    await closeDataSource();
    logger.info('Database connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

bootstrap();
