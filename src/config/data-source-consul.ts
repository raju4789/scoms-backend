import { DataSource } from 'typeorm';
import { Order } from '../models/Order';
import { Warehouse } from '../models/Warehouse';
import consulService from './consul';
import logger from '../utils/logger';

/**
 * Consul-enabled TypeORM DataSource configuration
 *
 * This creates a TypeORM DataSource that gets its configuration from Consul,
 * allowing for runtime configuration changes without application restart.
 */

let AppDataSource: DataSource;

/**
 * Initialize TypeORM DataSource with Consul configuration
 */
export async function initializeDataSource(): Promise<DataSource> {
  try {
    // Initialize Consul service first
    await consulService.initialize();

    // Get database configuration from Consul
    const dbConfig = consulService.getDatabaseConfig();

    logger.info('Initializing TypeORM DataSource with Consul configuration', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
    });

    AppDataSource = new DataSource({
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
      synchronize: true, // TODO: Set to false in production for safety and use migrations instead
      logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      entities: [Order, Warehouse],
      migrations: [],
      subscribers: [],
      maxQueryExecutionTime: dbConfig.connectionTimeout || 30000,
      extra: {
        max: dbConfig.maxConnections || 10,
        connectionTimeoutMillis: dbConfig.connectionTimeout || 30000,
        idleTimeoutMillis: 30000,
      },
    });

    await AppDataSource.initialize();
    logger.info('TypeORM DataSource initialized successfully with Consul configuration');

    return AppDataSource;
  } catch (error) {
    logger.error('Failed to initialize TypeORM DataSource with Consul configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fallback to environment-based configuration
    logger.info('Falling back to environment-based DataSource configuration');
    return initializeFallbackDataSource();
  }
}

/**
 * Fallback DataSource initialization using environment variables
 */
async function initializeFallbackDataSource(): Promise<DataSource> {
  try {
    AppDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'scoms',
      ssl: process.env.DB_SSL === 'true',
      synchronize: true, // TODO: Set to false in production for safety and use migrations instead
      logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      entities: [Order, Warehouse],
      migrations: [],
      subscribers: [],
    });

    await AppDataSource.initialize();
    logger.info('Fallback TypeORM DataSource initialized successfully');

    return AppDataSource;
  } catch (error) {
    logger.error('Failed to initialize fallback TypeORM DataSource', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get the current DataSource instance
 */
export function getDataSource(): DataSource {
  if (!AppDataSource) {
    throw new Error('DataSource not initialized. Call initializeDataSource() first.');
  }
  return AppDataSource;
}

/**
 * Close the DataSource connection
 */
export async function closeDataSource(): Promise<void> {
  if (AppDataSource && AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('TypeORM DataSource connection closed');
  }
}

// For backward compatibility, export the DataSource instance
// Note: This will be undefined until initializeDataSource() is called
export { AppDataSource };
