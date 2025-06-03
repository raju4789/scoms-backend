import pino from 'pino';
import fs from 'fs';

/**
 * SCOMS Backend Logger Configuration
 *
 * Features:
 * - Colored output in development for better readability
 * - Structured JSON logs in production for log aggregation (Loki/ELK)
 * - Comprehensive serializers for errors, requests, and responses
 * - Minimal labels to avoid high cardinality in log systems
 *
 * Environment variables:
 * - LOG_LEVEL: trace|debug|info|warn|error|fatal (default: info)
 * - NODE_ENV: development|production|test
 * - HOSTNAME/POD_NAME: Instance identifier for distributed systems
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL ?? 'info';

// Ensure logs directory exists in development
if (isDevelopment) {
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', { recursive: true });
  }
}

const logger = pino({
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,

  // In development: pretty console. In production: JSON
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
          },
        },
      }
    : {}),

  // Enhanced serializers for better log structure
  serializers: {
    err: (
      err: Error & {
        code?: string;
        statusCode?: number;
        correlationId?: string;
        stack?: string;
      }
    ) => ({
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode,
      correlationId: err.correlationId,
    }),

    req: (req: {
      method?: string;
      url?: string;
      headers?: Record<string, unknown>;
      ip?: string;
      correlationId?: string;
      connection?: { remoteAddress?: string };
    }) => ({
      method: req.method,
      url: req.url,
      userAgent: req.headers?.['user-agent'],
      contentType: req.headers?.['content-type'],
      correlationId: req.correlationId,
      ip: req.ip ?? req.connection?.remoteAddress,
    }),

    res: (res: { statusCode?: number; getHeader?: (name: string) => unknown }) => ({
      statusCode: res.statusCode,
      contentType: res.getHeader?.('content-type'),
    }),
  },

  formatters: {
    level: (label: string) => ({ level: label }),
    log: (obj: Record<string, unknown>) => ({
      ...obj,
      '@timestamp': new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
    }),
  },

  // No second transport configuration needed
});

// In development, also create a file logger for Promtail to pick up
let fileLogger: pino.Logger | null = null;
if (isDevelopment) {
  fileLogger = pino(
    {
      level: logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (obj: Record<string, unknown>) => ({
          ...obj,
          '@timestamp': new Date().toISOString(),
          environment: process.env.NODE_ENV ?? 'development',
        }),
      },
    },
    pino.destination('./logs/scoms-app.log')
  );
}

// Enhanced logger that writes to both console (pretty) and file (JSON) in development
const enhancedLogger = {
  trace: (msg: string, obj?: unknown) => {
    if (obj) {
      logger.trace(obj, msg);
      if (fileLogger) fileLogger.trace(obj, msg);
    } else {
      logger.trace(msg);
      if (fileLogger) fileLogger.trace(msg);
    }
  },
  debug: (msg: string, obj?: unknown) => {
    if (obj) {
      logger.debug(obj, msg);
      if (fileLogger) fileLogger.debug(obj, msg);
    } else {
      logger.debug(msg);
      if (fileLogger) fileLogger.debug(msg);
    }
  },
  info: (msg: string, obj?: unknown) => {
    if (obj) {
      logger.info(obj, msg);
      if (fileLogger) fileLogger.info(obj, msg);
    } else {
      logger.info(msg);
      if (fileLogger) fileLogger.info(msg);
    }
  },
  warn: (msg: string, obj?: unknown) => {
    if (obj) {
      logger.warn(obj, msg);
      if (fileLogger) fileLogger.warn(obj, msg);
    } else {
      logger.warn(msg);
      if (fileLogger) fileLogger.warn(msg);
    }
  },
  error: (msg: string, obj?: unknown) => {
    if (obj) {
      logger.error(obj, msg);
      if (fileLogger) fileLogger.error(obj, msg);
    } else {
      logger.error(msg);
      if (fileLogger) fileLogger.error(msg);
    }
  },
  fatal: (msg: string, obj?: unknown) => {
    if (obj) {
      logger.fatal(obj, msg);
      if (fileLogger) fileLogger.fatal(obj, msg);
    } else {
      logger.fatal(msg);
      if (fileLogger) fileLogger.fatal(msg);
    }
  },
  child: (bindings: Record<string, unknown>) => logger.child(bindings),
};

export default isDevelopment
  ? enhancedLogger
  : {
      trace: (msg: string, obj?: unknown) => (obj ? logger.trace(obj, msg) : logger.trace(msg)),
      debug: (msg: string, obj?: unknown) => (obj ? logger.debug(obj, msg) : logger.debug(msg)),
      info: (msg: string, obj?: unknown) => (obj ? logger.info(obj, msg) : logger.info(msg)),
      warn: (msg: string, obj?: unknown) => (obj ? logger.warn(obj, msg) : logger.warn(msg)),
      error: (msg: string, obj?: unknown) => (obj ? logger.error(obj, msg) : logger.error(msg)),
      fatal: (msg: string, obj?: unknown) => (obj ? logger.fatal(obj, msg) : logger.fatal(msg)),
      child: (bindings: Record<string, unknown>) => logger.child(bindings),
    };
