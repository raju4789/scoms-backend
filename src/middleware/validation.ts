import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../errors/ErrorTypes';
import logger from '../utils/logger';

/**
 * Generic validation middleware factory
 * This creates middleware that validates request data using provided validation functions
 */
export function validateRequest<T>(
  validationFn: (data: unknown) => T,
  source: 'body' | 'params' | 'query' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[source];

      logger.debug('Validating request data', {
        correlationId: req.correlationId,
        source,
        data: dataToValidate,
      });

      // Perform validation
      const validatedData = validationFn(dataToValidate as unknown);

      // Store validated data back to request object
      req[source] = validatedData;

      logger.debug('Request validation successful', {
        correlationId: req.correlationId,
        source,
      });

      next();
    } catch (error) {
      logger.warn('Request validation failed', {
        correlationId: req.correlationId,
        source,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        data: req[source],
      });

      // If it's already a ValidationError, pass it through
      if (error instanceof ValidationError) {
        next(error);
      } else {
        // Wrap other errors in ValidationError
        next(
          new ValidationError(
            error instanceof Error ? error.message : 'Request validation failed',
            { source, originalError: error }
          )
        );
      }
    }
  };
}

/**
 * Middleware to validate request body size and content type
 */
export function validateRequestFormat(req: Request, res: Response, next: NextFunction): void {
  // Check content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');

    if (!contentType) {
      logger.warn('Missing content-type header', {
        correlationId: req.correlationId,
        method: req.method,
      });
      return next(new ValidationError('Content-Type header is required'));
    }

    if (!contentType.toLowerCase().includes('application/json')) {
      logger.warn('Invalid content type', { correlationId: req.correlationId, contentType });
      return next(new ValidationError('Content-Type must be application/json'));
    }
  }

  return next();
}

/**
 * Middleware to sanitize request data (remove potentially dangerous fields)
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  // Remove common potentially dangerous fields
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];

  const sanitizeObject = (obj: unknown, seen = new WeakSet()): unknown => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Handle circular references
    if (seen.has(obj)) {
      return {};
    }
    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item, seen));
    }

    // Handle Date objects specifically
    if (obj instanceof Date) {
      return obj;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (!dangerousFields.includes(key)) {
        sanitized[key] = sanitizeObject(value, seen);
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query) as import('qs').ParsedQs;
  }

  next();
}
