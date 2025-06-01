import Consul from 'consul';
import logger from '../utils/logger';
import * as dotenv from 'dotenv';
import path from 'path';

/**
 * SCOMS Consul Configuration Service
 *
 * Provides centralized configuration management with hot reloading capabilities.
 * Supports fallback to environment variables when Consul is unavailable.
 *
 * Features:
 * - Hot configuration reloading without restart
 * - Environment-based configuration (development vs production)
 * - Graceful fallback to local environment variables
 * - Type-safe configuration access
 * - Automatic retry and reconnection logic
 * - Configuration validation with error handling
 * - Metadata tracking for version and update timestamps
 */

interface ConsulConfig {
  host: string;
  port: number;
  secure?: boolean;
  promisify?: boolean;
}

interface OrderConfig {
  devicePrice: number;
  deviceWeightKg: number;
  shippingRatePerKgKm: number;
  shippingCostThresholdPercent: number;
  discountTiers: Array<{
    minQuantity: number;
    discount: number;
  }>;
}

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

interface MetadataConfig {
  version: string;
  lastUpdated: string;
  environment: string;
  description?: string;
}

interface AppConfig {
  order: OrderConfig;
  database: DatabaseConfig;
  metadata?: MetadataConfig;
  server: {
    port: number;
    environment: string;
    logLevel: string;
  };
}

class ConsulService {
  private consul: Consul;
  private environment: string;
  private isConnected: boolean = false;
  private configCache: AppConfig | null = null;
  private configWatchers: Map<string, any> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 5000; // 5 seconds

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';

    // Load environment-specific .env file
    this.loadEnvironmentConfig();

    const consulConfig: ConsulConfig = {
      host: process.env.CONSUL_HOST || 'localhost',
      port: parseInt(process.env.CONSUL_PORT || '8500'),
      secure: process.env.CONSUL_SECURE === 'true',
      promisify: true,
    };

    this.consul = new Consul(consulConfig);
    logger.info('Consul service initialized', {
      environment: this.environment,
      consulHost: consulConfig.host,
      consulPort: consulConfig.port,
    });
  }

  /**
   * Load environment-specific configuration
   */
  private loadEnvironmentConfig(): void {
    try {
      // Load base .env file
      dotenv.config();

      // Load environment-specific .env file
      const envFile = `.env.${this.environment}`;
      const envPath = path.resolve(process.cwd(), envFile);

      dotenv.config({ path: envPath });

      logger.info('Environment configuration loaded', {
        environment: this.environment,
        envFile,
      });
    } catch (error) {
      logger.warn('Failed to load environment configuration, using defaults', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Initialize Consul connection and load configuration
   */
  async initialize(): Promise<void> {
    try {
      await this.testConnection();
      await this.loadConfiguration();
      await this.setupConfigurationWatchers();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Consul service successfully initialized');
    } catch (error) {
      logger.warn('Failed to initialize Consul, falling back to environment variables', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.loadFallbackConfiguration();
    }
  }

  /**
   * Test Consul connection
   */
  private async testConnection(): Promise<void> {
    try {
      await this.consul.status.leader();
      logger.info('Consul connection test successful');
    } catch (error) {
      logger.error('Consul connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validate configuration structure and values
   * Following industry best practices to validate before applying
   */
  private validateConfiguration(config: AppConfig): boolean {
    try {
      // Validate database configuration
      if (!config.database) {
        logger.error('Invalid configuration: database section missing');
        return false;
      }

      if (!config.database.host || !config.database.port) {
        logger.error('Invalid configuration: database host/port missing');
        return false;
      }

      // Validate order configuration
      if (!config.order) {
        logger.error('Invalid configuration: order section missing');
        return false;
      }

      if (typeof config.order.devicePrice !== 'number' || config.order.devicePrice <= 0) {
        logger.error('Invalid configuration: devicePrice must be a positive number');
        return false;
      }

      if (!Array.isArray(config.order.discountTiers)) {
        logger.error('Invalid configuration: discountTiers must be an array');
        return false;
      }

      // Validate server configuration
      if (!config.server) {
        logger.error('Invalid configuration: server section missing');
        return false;
      }

      if (!config.server.port || config.server.port <= 0) {
        logger.error('Invalid configuration: server port must be a positive number');
        return false;
      }

      // Add validation for metadata section
      if (config.metadata) {
        if (!config.metadata.version) {
          logger.warn('Configuration missing version metadata');
        }

        if (!config.metadata.environment) {
          logger.warn('Configuration missing environment metadata');
        } else {
          // Validate environment matches current environment
          const currentEnv = process.env.NODE_ENV || 'development';
          if (config.metadata.environment !== currentEnv) {
            logger.warn(
              `Environment mismatch: config is for '${config.metadata.environment}' but current environment is '${currentEnv}'`,
            );
            // We still allow this, but warn about it
          }
        }

        if (!config.metadata.lastUpdated) {
          logger.warn('Configuration missing lastUpdated metadata');
        }
      } else {
        logger.warn('Configuration missing metadata section');
      }

      logger.info('Configuration validation passed');
      return true;
    } catch (error) {
      logger.error('Configuration validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Load configuration from Consul
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const environment = this.environment;
      const configKey = `scoms/${environment}/config`;

      // Try to get existing configuration
      const result = await this.consul.kv.get(configKey);

      if (result && result.Value) {
        const parsedConfig = JSON.parse(result.Value);

        // Validate configuration before applying
        if (this.validateConfiguration(parsedConfig)) {
          this.configCache = parsedConfig;
          logger.info('Configuration loaded and validated from Consul', {
            key: configKey,
            environment,
            version: parsedConfig.metadata?.version || 'unknown',
          });

          // Verify environment matches
          if (
            parsedConfig.metadata?.environment &&
            parsedConfig.metadata.environment !== environment
          ) {
            logger.warn('Environment mismatch in loaded configuration', {
              expected: environment,
              found: parsedConfig.metadata.environment,
            });
          }
        } else {
          logger.warn('Using default configuration due to validation failure');
          this.loadFallbackConfiguration();
        }
      } else {
        // Initialize with default configuration if not exists
        logger.info('No configuration found in Consul, initializing defaults');
        await this.initializeDefaultConfiguration(configKey);
      }
    } catch (error) {
      logger.error('Failed to load configuration from Consul', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Initialize default configuration in Consul
   */
  private async initializeDefaultConfiguration(configKey: string): Promise<void> {
    const defaultConfig: AppConfig = this.getDefaultConfiguration();

    try {
      await this.consul.kv.set(configKey, JSON.stringify(defaultConfig, null, 2));
      this.configCache = defaultConfig;
      logger.info('Default configuration initialized in Consul', { key: configKey });
    } catch (error) {
      logger.error('Failed to initialize default configuration in Consul', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get default configuration based on environment variables
   */
  private getDefaultConfiguration(): AppConfig {
    const environment = this.environment;
    const timestamp = new Date().toISOString();

    return {
      order: {
        devicePrice: parseFloat(process.env.DEVICE_PRICE || '150'),
        deviceWeightKg: parseFloat(process.env.DEVICE_WEIGHT_KG || '0.365'),
        shippingRatePerKgKm: parseFloat(process.env.SHIPPING_RATE_PER_KG_KM || '0.01'),
        shippingCostThresholdPercent: parseFloat(
          process.env.SHIPPING_COST_THRESHOLD_PERCENT || '0.15',
        ),
        discountTiers: [
          { minQuantity: 250, discount: 0.2 },
          { minQuantity: 100, discount: 0.15 },
          { minQuantity: 50, discount: 0.1 },
          { minQuantity: 25, discount: 0.05 },
        ],
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'scoms',
        ssl: process.env.DB_SSL === 'true',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      },
      server: {
        port: parseInt(process.env.PORT || '3000'),
        environment,
        logLevel: process.env.LOG_LEVEL || 'info',
      },
      metadata: {
        version: '1.0.0',
        lastUpdated: timestamp,
        environment,
        description: `Default SCOMS ${environment} configuration`,
      },
    };
  }

  /**
   * Load fallback configuration from environment variables
   */
  private loadFallbackConfiguration(): void {
    this.configCache = this.getDefaultConfiguration();
    logger.info('Fallback configuration loaded from environment variables');
  }

  /**
   * Setup configuration watchers for hot reloading
   */
  private async setupConfigurationWatchers(): Promise<void> {
    try {
      const environment = this.environment;
      const configKey = `scoms/${environment}/config`;

      const watcher = this.consul.watch({
        method: this.consul.kv.get,
        options: { key: configKey },
      });

      watcher.on('change', (data: Record<string, any>) => {
        try {
          if (data && data.Value) {
            const newConfig = JSON.parse(data.Value);

            // Validate configuration before applying
            if (this.validateConfiguration(newConfig)) {
              const oldVersion = this.configCache?.metadata?.version || 'unknown';
              const newVersion = newConfig.metadata?.version || 'unknown';

              this.configCache = newConfig;

              logger.info('Configuration hot reloaded from Consul', {
                key: configKey,
                environment,
                oldVersion,
                newVersion,
                timestamp: new Date().toISOString(),
              });
            } else {
              logger.warn('Ignoring invalid configuration update', {
                key: configKey,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          logger.error('Failed to parse configuration update', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      watcher.on('error', (error: Error) => {
        logger.error('Configuration watcher error', {
          error: error.message,
          environment,
        });
        this.handleConnectionError();
      });

      this.configWatchers.set(configKey, watcher);
      logger.info('Configuration watcher setup complete', {
        key: configKey,
        environment,
      });
    } catch (error) {
      logger.error('Failed to setup configuration watchers', {
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: this.environment,
      });
    }
  }

  /**
   * Handle connection errors and implement retry logic
   */
  private async handleConnectionError(): Promise<void> {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(
        `Attempting to reconnect to Consul (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(async () => {
        try {
          await this.initialize();
        } catch (error) {
          logger.error('Reconnection attempt failed', {
            attempt: this.reconnectAttempts,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }, this.reconnectInterval);
    } else {
      logger.error('Max reconnection attempts reached, falling back to cached configuration');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    if (!this.configCache) {
      logger.warn('No configuration available, loading fallback');
      this.loadFallbackConfiguration();
    }
    return this.configCache as AppConfig;
  }

  /**
   * Get order-specific configuration
   */
  getOrderConfig(): OrderConfig {
    return this.getConfig().order;
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig(): DatabaseConfig {
    return this.getConfig().database;
  }

  /**
   * Get server-specific configuration
   */
  getServerConfig(): { port: number; environment: string; logLevel: string } {
    return this.getConfig().server;
  }

  /**
   * Get whether Consul is connected
   */
  isConsulConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Update configuration in Consul
   */
  async updateConfig(config: Partial<AppConfig>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consul is not connected');
    }

    try {
      const environment = this.environment;
      const configKey = `scoms/${environment}/config`;

      const currentConfig = this.getConfig();

      // Create deep copy to avoid modifying the cache directly
      const updatedConfig = JSON.parse(JSON.stringify(currentConfig));

      // Apply updates with deep merge
      this.deepMerge(updatedConfig, config);

      // Update metadata
      if (!updatedConfig.metadata) {
        updatedConfig.metadata = {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          environment,
        };
      } else {
        // Increment patch version
        if (updatedConfig.metadata.version) {
          const versionParts = updatedConfig.metadata.version.split('.');
          if (versionParts.length === 3) {
            const patch = parseInt(versionParts[2]) + 1;
            updatedConfig.metadata.version = `${versionParts[0]}.${versionParts[1]}.${patch}`;
          }
        }

        updatedConfig.metadata.lastUpdated = new Date().toISOString();
        updatedConfig.metadata.environment = environment;
      }

      // Validate updated configuration
      const isValid = this.validateConfiguration(updatedConfig);
      if (!isValid) {
        throw new Error('Updated configuration is invalid');
      }

      await this.consul.kv.set(configKey, JSON.stringify(updatedConfig, null, 2));
      logger.info('Configuration updated in Consul', {
        key: configKey,
        environment,
        version: updatedConfig.metadata?.version,
      });
    } catch (error) {
      logger.error('Failed to update configuration in Consul', {
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: this.environment,
      });
      throw error;
    }
  }

  /**
   * Deep merge utility for configuration objects
   * This allows partial updates while preserving other values
   */
  private deepMerge(target: any, source: any): any {
    if (!source) return target;

    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    });

    return target;
  }

  /**
   * Get Consul health status
   */
  async getHealthStatus(): Promise<{ status: string; leader: string | null; peers: string[] }> {
    try {
      const leader = await this.consul.status.leader();
      const peers = await this.consul.status.peers();

      return {
        status: this.isConnected ? 'healthy' : 'disconnected',
        leader,
        peers,
      };
    } catch {
      return {
        status: 'error',
        leader: null,
        peers: [],
      };
    }
  }

  /**
   * Cleanup watchers and connections
   */
  async cleanup(): Promise<void> {
    try {
      // Stop all watchers
      for (const [key, watcher] of this.configWatchers.entries()) {
        watcher.end();
        logger.info('Configuration watcher stopped', { key });
      }
      this.configWatchers.clear();

      this.isConnected = false;
      logger.info('Consul service cleanup completed');
    } catch (error) {
      logger.error('Error during Consul service cleanup', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const consulService = new ConsulService();
export default consulService;
export { OrderConfig, DatabaseConfig, AppConfig };
