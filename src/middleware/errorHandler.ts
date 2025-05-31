import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ValidationError,
  ErrorResponse, 
  ErrorMetrics, 
  ErrorCategory, 
  ErrorSeverity 
} from '../errors/ErrorTypes';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { ErrorMetricsService } from '../services/errorMetricsService';

/**
 * Enhanced error handler middleware with industry best practices:
 * - Structured error responses
 * - Correlation ID tracking
 * - Error metrics collection
 * - Environment-specific error details
 * - Rate limiting and circuit breaking
 * - Comprehensive logging with context
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const errorId = uuidv4();
  const correlationId = req.correlationId || uuidv4();
  const isProduction = process.env.NODE_ENV === 'production';
  const metricsService = ErrorMetricsService.getInstance();

  // Prevent duplicate error handling
  if (res.headersSent) {
    logger.warn({ errorId, correlationId }, 'Headers already sent, cannot handle error');
    return next(err);
  }

  // Check for circuit breaker
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  if (metricsService.shouldCircuitBreak(endpoint)) {
    logger.warn({ correlationId, endpoint }, 'Circuit breaker activated for endpoint');
    return sendErrorResponse(res, {
      statusCode: StatusCodes.SERVICE_UNAVAILABLE,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      message: 'Service temporarily unavailable',
      errorId,
      correlationId,
      retryable: true,
      helpUrl: '/docs/circuit-breaker'
    });
  }

  let errorDetails: {
    statusCode: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    isOperational: boolean;
    retryable: boolean;
    helpUrl?: string;
    details?: any;
  };

  // Enhanced error classification and handling
  if (err instanceof AppError) {
    errorDetails = {
      statusCode: err.statusCode,
      category: err.category,
      severity: err.severity,
      message: err.message,
      isOperational: err.isOperational,
      retryable: err.retryable,
      helpUrl: err.helpUrl,
      details: err instanceof ValidationError ? err.details : undefined
    };
  } else if (err.name === 'ValidationError' || (err.errors && Array.isArray(err.errors))) {
    errorDetails = {
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: 'Validation failed',
      isOperational: true,
      retryable: false,
      details: err.errors || err.details
    };
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    errorDetails = {
      statusCode: StatusCodes.UNAUTHORIZED,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      message: 'Authentication failed',
      isOperational: true,
      retryable: false,
      helpUrl: '/docs/authentication'
    };
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    errorDetails = {
      statusCode: StatusCodes.SERVICE_UNAVAILABLE,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      message: 'Network connectivity issue',
      isOperational: true,
      retryable: true
    };
  } else if (err.code?.startsWith('23') || err.name?.includes('Query')) { // PostgreSQL error codes
    errorDetails = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      message: 'Database operation failed',
      isOperational: true,
      retryable: true
    };
  } else {
    // Unknown/system errors
    errorDetails = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.CRITICAL,
      message: isProduction ? 'Internal server error' : err.message,
      isOperational: false,
      retryable: false
    };
  }

  // Comprehensive error logging with context
  const logContext = {
    errorId,
    correlationId,
    category: errorDetails.category,
    severity: errorDetails.severity,
    statusCode: errorDetails.statusCode,
    isOperational: errorDetails.isOperational,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id,
    requestBody: req.method !== 'GET' ? req.body : undefined,
    ...(errorDetails.severity === ErrorSeverity.CRITICAL && { stack: err.stack })
  };

  // Log based on severity
  if (errorDetails.severity === ErrorSeverity.CRITICAL) {
    logger.error(logContext, `CRITICAL ERROR: ${err.message}`);
  } else if (errorDetails.severity === ErrorSeverity.HIGH) {
    logger.error(logContext, `High severity error: ${err.message}`);
  } else if (errorDetails.severity === ErrorSeverity.MEDIUM) {
    logger.warn(logContext, `Medium severity error: ${err.message}`);
  } else {
    logger.info(logContext, `Low severity error: ${err.message}`);
  }

  // Record error metrics
  const metrics: ErrorMetrics = {
    errorId,
    correlationId,
    category: errorDetails.category,
    severity: errorDetails.severity,
    statusCode: errorDetails.statusCode,
    duration: Date.now() - startTime,
    endpoint,
    method: req.method,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress
  };
  
  metricsService.recordError(metrics);

  // Send structured error response
  sendErrorResponse(res, {
    ...errorDetails,
    errorId,
    correlationId
  });
}

/**
 * Send structured error response
 */
function sendErrorResponse(
  res: Response,
  errorInfo: {
    statusCode: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    errorId: string;
    correlationId: string;
    retryable?: boolean;
    helpUrl?: string;
    details?: any;
  }
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const response: ErrorResponse = {
    isSuccess: false,
    data: null,
    errorDetails: {
      errorCode: errorInfo.statusCode,
      errorMessage: errorInfo.message,
      errorId: errorInfo.errorId,
      correlationId: errorInfo.correlationId,
      category: errorInfo.category,
      severity: errorInfo.severity,
      timestamp: new Date().toISOString(),
      retryable: errorInfo.retryable || false,
      ...(errorInfo.helpUrl && { helpUrl: errorInfo.helpUrl }),
      ...(errorInfo.details && !isProduction && { details: errorInfo.details })
    }
  };

  res.status(errorInfo.statusCode).json(response);
}

/**
 * Middleware to handle async route errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({
      type: 'unhandled_rejection',
      reason,
      promise
    }, 'Unhandled Promise Rejection');
    
    // Graceful shutdown in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error) => {
    logger.error({
      type: 'uncaught_exception',
      error,
      stack: error.stack
    }, 'Uncaught Exception');
    
    // Graceful shutdown
    process.exit(1);
  });
}
