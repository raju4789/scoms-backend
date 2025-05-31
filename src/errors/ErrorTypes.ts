import { StatusCodes } from 'http-status-codes';

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for better classification and handling
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  NETWORK = 'network',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

/**
 * Error context interface for structured logging
 */
export interface ErrorContext {
  correlationId: string;
  userId?: string;
  tenantId?: string;
  operation?: string;
  resource?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Enhanced error response structure
 */
export interface ErrorResponse {
  isSuccess: false;
  data: null;
  errorDetails: {
    errorCode: number;
    errorMessage: string;
    errorId: string;
    correlationId: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    timestamp: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
    helpUrl?: string;
  };
}

/**
 * Error metrics for monitoring
 */
export interface ErrorMetrics {
  errorId: string;
  correlationId: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  statusCode: number;
  duration: number;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Base application error with enhanced metadata
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;
  public readonly helpUrl?: string;
  public readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      isOperational?: boolean;
      context?: ErrorContext;
      retryable?: boolean;
      helpUrl?: string;
      cause?: unknown;
    } = {}
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = options.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    this.category = options.category || ErrorCategory.UNKNOWN;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    this.retryable = options.retryable || false;
    this.helpUrl = options.helpUrl;
    this.cause = options.cause;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, context?: ErrorContext) {
    super(message, {
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context,
      retryable: false,
    });

    this.details = details;
  }

  public readonly details?: Record<string, unknown>;
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, {
      statusCode: StatusCodes.UNAUTHORIZED,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      context,
      retryable: false,
      helpUrl: '/docs/authentication',
    });
  }
}

/**
 * Authorization error for permission failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: ErrorContext) {
    super(message, {
      statusCode: StatusCodes.FORBIDDEN,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      context,
      retryable: false,
      helpUrl: '/docs/permissions',
    });
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string, context?: ErrorContext) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(message, {
      statusCode: StatusCodes.NOT_FOUND,
      category: ErrorCategory.NOT_FOUND,
      severity: ErrorSeverity.LOW,
      context,
      retryable: false,
    });
  }
}

/**
 * Business logic error for domain rule violations
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, {
      statusCode: StatusCodes.BAD_REQUEST,
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      context,
      retryable: false,
    });
  }
}

/**
 * External service error for third-party API failures
 */
export class ExternalServiceError extends AppError {
  constructor(serviceName: string, originalError?: Error, context?: ErrorContext) {
    super(`External service '${serviceName}' is unavailable`, {
      statusCode: StatusCodes.BAD_GATEWAY,
      category: ErrorCategory.EXTERNAL_SERVICE,
      severity: ErrorSeverity.HIGH,
      context,
      retryable: true,
      cause: originalError,
    });
  }
}

/**
 * Database error for data layer failures
 */
export class DatabaseError extends AppError {
  constructor(operation: string, originalError?: Error, context?: ErrorContext) {
    super(`Database operation '${operation}' failed`, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      context,
      retryable: true,
      cause: originalError,
    });
  }
}

/**
 * Network error for connectivity issues
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error, context?: ErrorContext) {
    super(message, {
      statusCode: StatusCodes.SERVICE_UNAVAILABLE,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      context,
      retryable: true,
      cause: originalError,
    });
  }
}

/**
 * System error for infrastructure failures
 */
export class SystemError extends AppError {
  constructor(message: string, originalError?: Error, context?: ErrorContext) {
    super(message, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      context,
      retryable: false,
      cause: originalError,
    });
  }
}
