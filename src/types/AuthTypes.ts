/**
 * Authentication Types for SCOMS
 *
 * Defines types for service-to-service authentication using API keys
 */

import { Request } from 'express';

export interface ApiKeyConfig {
  key: string;
  serviceName: string;
  permissions: string[];
  enabled: boolean;
  createdAt?: string;
  lastUsed?: string;
}

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKeyConfig;
  serviceName?: string;
}

export interface AuthConfig {
  apiKeys: Record<string, ApiKeyConfig>;
  requireAuth: boolean;
  bypassRoutes: string[];
}

export interface AuthValidationResult {
  isValid: boolean;
  apiKey?: ApiKeyConfig;
  error?: string;
}
