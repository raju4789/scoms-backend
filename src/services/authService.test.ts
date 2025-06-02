/**
 * Authentication Service Tests
 */

import authService from './authService';
import consulService from '../config/consul';

// Mock dependencies
jest.mock('../config/consul');
jest.mock('../utils/logger');

const mockConsulService = consulService as jest.Mocked<typeof consulService>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid Consul config', async () => {
      // Mock the consulService methods directly
      mockConsulService.getKV = jest.fn().mockResolvedValue({
        Value: JSON.stringify({
          requireAuth: true,
          bypassRoutes: ['/health'],
          apiKeys: {
            'test-key': {
              key: 'test-key',
              serviceName: 'test-service',
              permissions: ['test:read'],
              enabled: true,
            },
          },
        }),
      });

      await authService.initialize();

      expect(mockConsulService.getKV).toHaveBeenCalledWith('scoms/auth/config');
    });

    it('should create default config when Consul config does not exist', async () => {
      // Mock the consulService methods directly
      mockConsulService.getKV = jest.fn().mockResolvedValue(null);
      mockConsulService.setKV = jest.fn().mockResolvedValue(true);

      await authService.initialize();

      expect(mockConsulService.setKV).toHaveBeenCalledWith(
        'scoms/auth/config',
        expect.stringContaining('scoms-frontend-key'),
      );
    });
  });

  describe('validateApiKey', () => {
    beforeEach(async () => {
      // Mock the consulService methods directly
      mockConsulService.getKV = jest.fn().mockResolvedValue({
        Value: JSON.stringify({
          requireAuth: true,
          bypassRoutes: ['/health'],
          apiKeys: {
            'valid-key': {
              key: 'valid-key',
              serviceName: 'test-service',
              permissions: ['test:read'],
              enabled: true,
            },
            'disabled-key': {
              key: 'disabled-key',
              serviceName: 'disabled-service',
              permissions: ['test:read'],
              enabled: false,
            },
          },
        }),
      });

      await authService.initialize();
    });

    it('should validate a valid API key', async () => {
      const result = await authService.validateApiKey('valid-key');

      expect(result.isValid).toBe(true);
      expect(result.apiKey?.serviceName).toBe('test-service');
    });

    it('should reject an invalid API key', async () => {
      const result = await authService.validateApiKey('invalid-key');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should reject a disabled API key', async () => {
      const result = await authService.validateApiKey('disabled-key');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key is disabled');
    });
  });

  describe('shouldBypassAuth', () => {
    beforeEach(async () => {
      const mockConsulClient = {
        kv: {
          get: jest.fn().mockResolvedValue({
            Value: JSON.stringify({
              requireAuth: true,
              bypassRoutes: ['/health', '/metrics'],
              apiKeys: {},
            }),
          }),
          set: jest.fn().mockResolvedValue(true),
        },
      };

      (mockConsulService as any).consul = mockConsulClient;
      await authService.initialize();
    });

    it('should bypass auth for configured routes', async () => {
      const result = await authService.shouldBypassAuth('/health');
      expect(result).toBe(true);
    });

    it('should not bypass auth for other routes', async () => {
      const result = await authService.shouldBypassAuth('/orders');
      expect(result).toBe(false);
    });
  });
});
