import pino from 'pino';

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
const logLevel = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,

  // Enable pretty printing in development
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
      },
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
      ip: req.ip || req.connection?.remoteAddress,
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
    }),
  },

  // No second transport configuration needed
});

export default logger;
