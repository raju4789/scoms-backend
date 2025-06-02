/**
 * Authentication Middleware for SCOMS
 *
 * Provides service-to-service authentication using API keys
 * Integrates with Consul for centralized key management
 */

import { NextFunction, Request, Response } from 'express';
import authService from '../services/authService';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/AuthTypes';

/**
 * Extract API key from request headers
 */
function extractApiKey(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check x-api-key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const path = req.path;

    // Check if this route should bypass authentication
    const shouldBypass = await authService.shouldBypassAuth(path);
    if (shouldBypass) {
      logger.debug(`Bypassing authentication for path: ${path}`);
      next();
      return;
    }

    // Extract API key from request
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      res.status(401).json({
        error: 'Authentication required',
        message:
          'API key must be provided in Authorization header (Bearer token) or x-api-key header',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate API key
    const validationResult = await authService.validateApiKey(apiKey);
    if (!validationResult.isValid) {
      res.status(401).json({
        error: 'Authentication failed',
        message: validationResult.error || 'Invalid API key',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Add API key info to request for downstream use
    req.apiKey = validationResult.apiKey;
    req.serviceName = validationResult.apiKey?.serviceName;

    logger.debug(`Authentication successful for service: ${req.serviceName}`, {
      path,
      serviceName: req.serviceName,
      correlationId: req.headers['x-correlation-id'],
    });

    next();
    return;
  } catch (error) {
    logger.error('Authentication error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service temporarily unavailable',
      timestamp: new Date().toISOString(),
    });
    return;
  }
};

/**
 * Optional authentication middleware (for routes that work with or without auth)
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const apiKey = extractApiKey(req);

    if (apiKey) {
      const validationResult = await authService.validateApiKey(apiKey);
      if (validationResult.isValid) {
        req.apiKey = validationResult.apiKey;
        req.serviceName = validationResult.apiKey?.serviceName;
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    // Continue without auth for optional middleware
    next();
  }
};

/**
 * Permission check middleware factory
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'This endpoint requires authentication',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const hasPermission =
      req.apiKey.permissions.includes('*') || req.apiKey.permissions.includes(permission);

    if (!hasPermission) {
      logger.warn(`Permission denied for service ${req.serviceName}`, {
        requiredPermission: permission,
        servicePermissions: req.apiKey.permissions,
        correlationId: req.headers['x-correlation-id'],
      });

      res.status(403).json({
        error: 'Permission denied',
        message: `Service does not have required permission: ${permission}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
