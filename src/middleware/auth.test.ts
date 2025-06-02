/**
 * Authentication Middleware Tests
 */

import { NextFunction, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, requirePermission } from './auth';
import authService from '../services/authService';
import { AuthenticatedRequest } from '../types/AuthTypes';

// Mock dependencies
jest.mock('../services/authService');
jest.mock('../utils/logger');

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Authentication Middleware', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      path: '/orders',
      headers: {},
      ip: '127.0.0.1',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should bypass authentication for allowed routes', async () => {
      // Mock the request with a bypass route
      req = {
        ...req,
        path: '/health',
        originalUrl: '/health',
        url: '/health',
      } as any;
      mockAuthService.shouldBypassAuth.mockResolvedValue(true);

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should require API key for protected routes', async () => {
      mockAuthService.shouldBypassAuth.mockResolvedValue(false);

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate API key from Authorization header', async () => {
      req.headers!.authorization = 'Bearer valid-api-key';
      mockAuthService.shouldBypassAuth.mockResolvedValue(false);
      mockAuthService.validateApiKey.mockResolvedValue({
        isValid: true,
        apiKey: {
          key: 'valid-api-key',
          serviceName: 'test-service',
          permissions: ['orders:read'],
          enabled: true,
        },
      });

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(mockAuthService.validateApiKey).toHaveBeenCalledWith('valid-api-key');
      expect(req.serviceName).toBe('test-service');
      expect(next).toHaveBeenCalled();
    });

    it('should validate API key from x-api-key header', async () => {
      req.headers!['x-api-key'] = 'valid-api-key';
      mockAuthService.shouldBypassAuth.mockResolvedValue(false);
      mockAuthService.validateApiKey.mockResolvedValue({
        isValid: true,
        apiKey: {
          key: 'valid-api-key',
          serviceName: 'test-service',
          permissions: ['orders:read'],
          enabled: true,
        },
      });

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(mockAuthService.validateApiKey).toHaveBeenCalledWith('valid-api-key');
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid API key', async () => {
      req.headers!.authorization = 'Bearer invalid-key';
      mockAuthService.shouldBypassAuth.mockResolvedValue(false);
      mockAuthService.validateApiKey.mockResolvedValue({
        isValid: false,
        error: 'Invalid API key',
      });

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication failed',
          message: 'Invalid API key',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should continue without authentication when no API key provided', async () => {
      await optionalAuthMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate API key when provided', async () => {
      req.headers!.authorization = 'Bearer valid-key';
      mockAuthService.validateApiKey.mockResolvedValue({
        isValid: true,
        apiKey: {
          key: 'valid-key',
          serviceName: 'test-service',
          permissions: ['orders:read'],
          enabled: true,
        },
      });

      await optionalAuthMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(req.serviceName).toBe('test-service');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should allow access with correct permission', () => {
      req.apiKey = {
        key: 'test-key',
        serviceName: 'test-service',
        permissions: ['orders:read'],
        enabled: true,
      };

      const middleware = requirePermission('orders:read');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access with wildcard permission', () => {
      req.apiKey = {
        key: 'admin-key',
        serviceName: 'admin-service',
        permissions: ['*'],
        enabled: true,
      };

      const middleware = requirePermission('orders:write');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access without permission', () => {
      req.apiKey = {
        key: 'limited-key',
        serviceName: 'limited-service',
        permissions: ['orders:read'],
        enabled: true,
      };

      const middleware = requirePermission('orders:write');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Permission denied',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    // it('should require authentication', () => {
    //   const middleware = requirePermission('orders:read');
    //   middleware(req as AuthenticatedRequest, res as Response, next);

    //   expect(res.status).toHaveBeenCalledWith(401);
    //   expect(next).not.toHaveBeenCalled();
    // });
  });
});
