import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * Simple HTTP request/response logging middleware for Grafana Loki
 *
 * Logs:
 * - Incoming requests with method, URL, correlation ID
 * - Outgoing responses with status code, duration
 * - Errors automatically via error handler middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log incoming request
  logger.info(
    {
      type: 'http_request_start',
      method: req.method,
      url: req.originalUrl,
      correlationId: req.correlationId,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection?.remoteAddress,
      contentType: req.get('content-type'),
    },
    `${req.method} ${req.originalUrl} - Request started`,
  );

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: Parameters<typeof originalEnd>) {
    const duration = Date.now() - startTime;

    const logData = {
      type: 'http_request_complete',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      correlationId: req.correlationId,
      contentType: res.getHeader('content-type'),
    };

    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      // Server errors (5xx) - error level
      logger.error(logData, logMessage);
    } else if (res.statusCode >= 400) {
      // Client errors (4xx) including 404 - error level
      logger.error(logData, logMessage);
    } else if (res.statusCode >= 300) {
      // Redirects (3xx) - info level
      logger.info(logData, logMessage);
    } else {
      // Success (2xx) - info level
      logger.info(logData, logMessage);
    }

    // Call original end method
    return originalEnd.apply(this, args);
  } as typeof res.end;

  next();
}
