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

  // Minimal base fields for efficient log indexing
  base: {
    service: 'scoms-backend',
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    instance: process.env.HOSTNAME || process.env.POD_NAME || 'local',
  },

  // ISO timestamp for proper time-based queries
  timestamp: pino.stdTimeFunctions.isoTime,

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

  // Pretty colored output in development, JSON in production
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          colorizeObjects: true,
          levelFirst: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname,service,env,version,instance',
          messageFormat: (log: Record<string, unknown>, messageKey: string, levelLabel: string) => {
            const timestamp = new Date(log.time as string)
              .toISOString()
              .slice(0, 19)
              .replace('T', ' ');
            const level = levelLabel.toUpperCase().padEnd(5);
            const message = (log[messageKey] as string) || '';
            return `${level} [${timestamp}]: ${message}`;
          },
          customColors: 'trace:magenta,debug:cyan,info:green,warn:yellow,error:red,fatal:bgRed',
        },
      }
    : undefined,
});

export default logger;
