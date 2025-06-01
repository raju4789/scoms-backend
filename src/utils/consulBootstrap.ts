import Consul from 'consul';
import logger from './logger';

/**
 * SCOMS Consul Bootstrap Service
 *
 * Automatically preloads environment-specific configurations into Consul on startup.
 * Each environment has independent configuration values that can be updated separately.
 *
 * Key Features:
 * - Environment-specific configuration isolation (dev vs prod)
 * - Independent configuration values optimized for each environment
 * - Automatic preloading on application startup
 * - Hot-reload compatible (changes persist until manually updated)
 * - Graceful error handling and non-blocking startup
 * - Prevents overwriting existing manual configurations
 *
 * Configuration Differences:
 * - Development: Lower prices, verbose logging, easier testing thresholds
 * - Production: Market prices, performance logging, business-ready settings
 */

// Development configuration - Optimized for local development and testing
const devConfig = {
  // Order Configuration - Development Values (more permissive for testing)
  'scoms/development/config/order/devicePrice': '100', // Lower price for dev testing
  'scoms/development/config/order/deviceWeightKg': '2.0', // Heavier weight for testing shipping calculations
  'scoms/development/config/order/shippingRatePerKgKm': '0.5', // Higher rate for testing scenarios
  'scoms/development/config/order/shippingCostThresholdPercent': '10', // Lower threshold for easier testing
  'scoms/development/config/order/discountTiers': JSON.stringify([
    { minQuantity: 1, discount: 0 }, // No minimum for testing
    { minQuantity: 5, discount: 0.05 }, // Lower quantities for dev testing
    { minQuantity: 10, discount: 0.1 }, // Easier to reach tiers
    { minQuantity: 25, discount: 0.15 },
    { minQuantity: 50, discount: 0.2 }, // Max discount at lower quantity
  ]),

  // Database Configuration - Development Values
  'scoms/development/config/database/host': process.env.DB_HOST || 'localhost',
  'scoms/development/config/database/port': process.env.DB_PORT || '5432',
  'scoms/development/config/database/username': process.env.DB_USERNAME || 'postgres',
  'scoms/development/config/database/password': process.env.DB_PASSWORD || 'postgres',
  'scoms/development/config/database/database': process.env.DB_NAME || 'scoms',
  'scoms/development/config/database/ssl': 'false', // No SSL for local dev
  'scoms/development/config/database/maxConnections': '10', // Lower connection pool
  'scoms/development/config/database/connectionTimeout': '30000', // Shorter timeout

  // Server Configuration - Development Values
  'scoms/development/config/server/port': '3000',
  'scoms/development/config/server/environment': 'development',
  'scoms/development/config/server/logLevel': 'debug', // Verbose logging for debugging

  // Metadata
  'scoms/development/config/metadata/version': '1.0.0-dev',
  'scoms/development/config/metadata/lastUpdated': new Date().toISOString(),
  'scoms/development/config/metadata/environment': 'development',
  'scoms/development/config/metadata/description':
    'SCOMS Development Configuration - Optimized for local testing',
};

// Production configuration - Optimized for real-world business operations
const prodConfig = {
  // Order Configuration - Production Values (business-ready)
  'scoms/production/config/order/devicePrice': '150', // Market price
  'scoms/production/config/order/deviceWeightKg': '0.365', // Real ScreenCloud device weight
  'scoms/production/config/order/shippingRatePerKgKm': '0.01', // Competitive shipping rate
  'scoms/production/config/order/shippingCostThresholdPercent': '15', // Business threshold
  'scoms/production/config/order/discountTiers': JSON.stringify([
    { minQuantity: 1, discount: 0 }, // Standard retail
    { minQuantity: 50, discount: 0.05 }, // Small business discount
    { minQuantity: 100, discount: 0.1 }, // Volume discount
    { minQuantity: 500, discount: 0.15 }, // Enterprise discount
    { minQuantity: 1000, discount: 0.2 }, // Large enterprise
  ]),

  // Database Configuration - Production Values
  'scoms/production/config/database/host': process.env.DB_HOST || 'postgres',
  'scoms/production/config/database/port': process.env.DB_PORT || '5432',
  'scoms/production/config/database/username': process.env.DB_USERNAME || 'postgres',
  'scoms/production/config/database/password': process.env.DB_PASSWORD || 'postgres',
  'scoms/production/config/database/database': process.env.DB_NAME || 'scoms',
  'scoms/production/config/database/ssl': 'true', // SSL required for production
  'scoms/production/config/database/maxConnections': '50', // Higher connection pool
  'scoms/production/config/database/connectionTimeout': '60000', // Longer timeout

  // Server Configuration - Production Values
  'scoms/production/config/server/port': '3000',
  'scoms/production/config/server/environment': 'production',
  'scoms/production/config/server/logLevel': 'warn', // Less verbose logging for performance

  // Metadata
  'scoms/production/config/metadata/version': '1.0.0',
  'scoms/production/config/metadata/lastUpdated': new Date().toISOString(),
  'scoms/production/config/metadata/environment': 'production',
  'scoms/production/config/metadata/description':
    'SCOMS Production Configuration - Business-ready settings',
};

/**
 * Preload Consul configuration for the current environment
 * This function automatically sets up the initial configuration in Consul
 * based on the NODE_ENV environment variable
 */
export async function preloadConsulConfig(): Promise<void> {
  const environment = process.env.NODE_ENV || 'development';
  const consul = new Consul({
    host: process.env.CONSUL_HOST || 'localhost',
    port: parseInt(process.env.CONSUL_PORT || '8500'),
  });

  // Select configuration based on environment
  const config = environment === 'production' ? prodConfig : devConfig;

  logger.info(`Preloading Consul ${environment} config...`, {
    environment,
    consulHost: process.env.CONSUL_HOST || 'localhost',
    consulPort: process.env.CONSUL_PORT || '8500',
    keysCount: Object.keys(config).length,
  });

  let successCount = 0;
  let errorCount = 0;

  for (const [key, value] of Object.entries(config)) {
    try {
      // Check if key already exists to avoid overwriting manual changes
      const existingValue = await consul.kv.get(key);

      if (!existingValue) {
        await consul.kv.set(key, value);
        logger.debug(`✅ Set Consul key: ${key}`, { key, value });
        successCount++;
      } else {
        logger.debug(`⏭️  Skipped existing key: ${key}`, { key });
      }
    } catch (err) {
      logger.error(`❌ Failed to set Consul key: ${key}`, {
        key,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      errorCount++;
    }
  }

  logger.info(`Consul ${environment} config preload complete`, {
    environment,
    successCount,
    errorCount,
    totalKeys: Object.keys(config).length,
  });

  if (errorCount > 0) {
    logger.warn(`Some configuration keys failed to load`, {
      environment,
      errorCount,
      successCount,
    });
  }
}
