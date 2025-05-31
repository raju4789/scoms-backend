import pino from 'pino';

/**
 * Loki-optimized logger configuration
 *
 * Key principles for Grafana Loki:
 * 1. Minimal labels (service, env, level) to avoid high cardinality
 * 2. Structured JSON logs with consistent field naming
 * 3. ISO timestamps for proper time-based queries
 *
 * Environment variables for configuration:
 * - LOG_LEVEL: Log level (debug, info, warn, error)
 * - NODE_ENV: Environment (development, production)
 * - HOSTNAME/POD_NAME: Instance identifier for distributed systems
 * - LOKI_ENDPOINT: Optional Loki push endpoint (e.g., http://loki:3100/loki/api/v1/push)
 */

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Base fields become Loki labels - keep minimal for performance
  base: {
    service: 'scoms-backend',
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    instance: process.env.HOSTNAME || process.env.POD_NAME || 'local',
  },

  // ISO timestamp format for Loki compatibility
  timestamp: pino.stdTimeFunctions.isoTime,

  // Enhanced serializers for better log structure
  serializers: {
    err: (err: Error & { code?: string; statusCode?: number; correlationId?: string }) => {
      return {
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode,
        correlationId: err.correlationId,
      };
    },
    req: (req: {
      method?: string;
      url?: string;
      headers?: Record<string, unknown>;
      ip?: string;
      correlationId?: string;
      connection?: { remoteAddress?: string };
    }) => {
      return {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers?.['user-agent'],
          'content-type': req.headers?.['content-type'],
        },
        correlationId: req.correlationId,
        ip: req.ip || req.connection?.remoteAddress,
      };
    },
    res: (res: {
      statusCode?: number;
      getHeader?: (name: string) => unknown;
      contentLength?: number;
    }) => {
      return {
        statusCode: res.statusCode,
        contentType: res.getHeader?.('content-type'),
      };
    },
  },

  formatters: {
    // Ensure level is always a string for Loki labels
    level(label) {
      return { level: label };
    },
    // Add consistent fields to every log entry
    log(obj: Record<string, unknown>) {
      return {
        ...obj,
        '@timestamp': new Date().toISOString(),
      };
    },
  },

  // Pretty print in development, JSON in production
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname,service,env,version,instance',
          },
        }
      : undefined,
});

export default logger;
