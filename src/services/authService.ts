/**
 * Authentication Service for SCOMS
 *
 * Handles service-to-service authentication using API keys stored in Consul
 * Provides caching and validation of API keys with consul integration
 */

import consulService from '../config/consul';
import logger from '../utils/logger';
import { ApiKeyConfig, AuthConfig, AuthValidationResult } from '../types/AuthTypes';

class AuthService {
  private authConfig: AuthConfig | null = null;
  private configCacheTime = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache
  private readonly CONSUL_AUTH_KEY = 'scoms/auth';

  /**
   * Initialize authentication configuration from Consul
   */
  async initialize(): Promise<void> {
    try {
      await this.loadAuthConfig();
      logger.info('Authentication service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize authentication service:', error);
      // Set default config for fallback
      this.authConfig = {
        apiKeys: {},
        requireAuth: false,
        bypassRoutes: ['/health', '/health/ready', '/metrics'],
      };
    }
  }

  /**
   * Load authentication configuration from Consul
   */
  private async loadAuthConfig(): Promise<void> {
    try {
      const result = await consulService.getKV(`${this.CONSUL_AUTH_KEY}/config`);

      // Type assertion to inform TypeScript about the Value property
      if (result && (result as { Value?: string }).Value) {
        const configData = JSON.parse((result as { Value: string }).Value);
        this.authConfig = configData;
        this.configCacheTime = Date.now();
        logger.info('Auth configuration loaded from Consul');
      } else {
        // Create default config in Consul if it doesn't exist
        await this.createDefaultAuthConfig();
      }
    } catch (error) {
      logger.error('Error loading auth config from Consul:', error);
      throw error;
    }
  }

  /**
   * Create default authentication configuration in Consul
   */
  private async createDefaultAuthConfig(): Promise<void> {
    const defaultConfig: AuthConfig = {
      requireAuth: true,
      bypassRoutes: ['/health', '/health/ready', '/metrics'],
      apiKeys: {
        'scoms-frontend-key': {
          key: 'scoms-frontend-key',
          serviceName: 'scoms-frontend',
          permissions: ['orders:read', 'orders:write', 'warehouses:read'],
          enabled: true,
          createdAt: new Date().toISOString(),
        },
        'scoms-admin-key': {
          key: 'scoms-admin-key',
          serviceName: 'scoms-admin',
          permissions: ['*'],
          enabled: true,
          createdAt: new Date().toISOString(),
        },
        'scoms-warehouse-service-key': {
          key: 'scoms-warehouse-service-key',
          serviceName: 'scoms-warehouse-service',
          permissions: ['warehouses:read', 'warehouses:write', 'orders:read'],
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      },
    };

    try {
      await consulService.setKV(
        `${this.CONSUL_AUTH_KEY}/config`,
        JSON.stringify(defaultConfig, null, 2),
      );
      this.authConfig = defaultConfig;
      this.configCacheTime = Date.now();
      logger.info('Default auth configuration created in Consul');
    } catch (error) {
      logger.error('Error creating default auth config in Consul:', error);
      throw error;
    }
  }

  /**
   * Get current authentication configuration with caching
   */
  private async getAuthConfig(): Promise<AuthConfig> {
    const now = Date.now();

    // Check if cache is still valid
    if (this.authConfig && now - this.configCacheTime < this.CACHE_TTL) {
      return this.authConfig;
    }

    // Reload from Consul
    await this.loadAuthConfig();
    return this.authConfig!;
  }

  /**
   * Validate an API key
   */
  async validateApiKey(apiKey: string): Promise<AuthValidationResult> {
    try {
      const config = await this.getAuthConfig();

      if (!config.requireAuth) {
        return { isValid: true };
      }

      const keyConfig = config.apiKeys[apiKey];

      if (!keyConfig) {
        return {
          isValid: false,
          error: 'Invalid API key',
        };
      }

      if (!keyConfig.enabled) {
        return {
          isValid: false,
          error: 'API key is disabled',
        };
      }

      // Update last used timestamp
      await this.updateLastUsed(apiKey);

      return {
        isValid: true,
        apiKey: keyConfig,
      };
    } catch (error) {
      logger.error('Error validating API key:', error);
      return {
        isValid: false,
        error: 'Authentication service error',
      };
    }
  }

  /**
   * Update last used timestamp for an API key
   */
  private async updateLastUsed(apiKey: string): Promise<void> {
    try {
      if (this.authConfig && this.authConfig.apiKeys[apiKey]) {
        this.authConfig.apiKeys[apiKey].lastUsed = new Date().toISOString();

        // Update in Consul (fire and forget)
        const consul = (consulService as unknown as { consul: { kv: { set: (key: string, value: string) => Promise<void> } } }).consul;
        consul.kv
          .set(`${this.CONSUL_AUTH_KEY}/config`, JSON.stringify(this.authConfig, null, 2))
          .catch((error: unknown) => logger.error('Error updating last used timestamp:', error));
      }
    } catch (error) {
      logger.error('Error updating last used timestamp:', error);
    }
  }

  /**
   * Check if a route should bypass authentication
   */
  async shouldBypassAuth(path: string): Promise<boolean> {
    try {
      const config = await this.getAuthConfig();
      return config.bypassRoutes.some((route) => path.startsWith(route));
    } catch (error) {
      logger.error('Error checking bypass routes:', error);
      return false;
    }
  }

  /**
   * Add a new API key
   */
  async addApiKey(keyConfig: ApiKeyConfig): Promise<void> {
    try {
      const config = await this.getAuthConfig();
      config.apiKeys[keyConfig.key] = {
        ...keyConfig,
        createdAt: new Date().toISOString(),
      };

      // Access consul directly from the service
      const consul = (consulService as unknown as { consul: { kv: { set: (key: string, value: string) => Promise<void> } } }).consul;
      await consul.kv.set(`${this.CONSUL_AUTH_KEY}/config`, JSON.stringify(config, null, 2));

      this.authConfig = config;
      this.configCacheTime = Date.now();

      logger.info(`API key added for service: ${keyConfig.serviceName}`);
    } catch (error) {
      logger.error('Error adding API key:', error);
      throw error;
    }
  }

  /**
   * Disable an API key
   */
  async disableApiKey(apiKey: string): Promise<void> {
    try {
      const config = await this.getAuthConfig();

      if (config.apiKeys[apiKey]) {
        config.apiKeys[apiKey].enabled = false;

        await consulService.setKV(
          `${this.CONSUL_AUTH_KEY}/config`,
          JSON.stringify(config, null, 2),
        );

        this.authConfig = config;
        this.configCacheTime = Date.now();

        logger.info(`API key disabled: ${apiKey}`);
      }
    } catch (error) {
      logger.error('Error disabling API key:', error);
      throw error;
    }
  }

  /**
   * Get all API keys (for admin purposes)
   */
  async getApiKeys(): Promise<Record<string, ApiKeyConfig>> {
    try {
      const config = await this.getAuthConfig();
      return config.apiKeys;
    } catch (error) {
      logger.error('Error getting API keys:', error);
      return {};
    }
  }
}

export default new AuthService();
