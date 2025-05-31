import { Request, Response, NextFunction } from 'express';
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
  logger.info({
    type: 'http_request_start',
    method: req.method,
    url: req.originalUrl,
    correlationId: req.correlationId,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection?.remoteAddress,
    contentType: req.get('content-type')
  }, `${req.method} ${req.originalUrl} - Request started`);

  // Override res.end to log response
  const originalEnd = res.end;
  (res as any).end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info({
      type: 'http_request_complete',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      correlationId: req.correlationId,
      contentType: res.getHeader('content-type')
    }, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
}
