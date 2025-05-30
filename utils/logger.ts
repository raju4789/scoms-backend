import pino from 'pino';
import createWriteStream from 'pino-loki';

// Loki endpoint and basic config can be moved to env/config for production
const lokiOptions = {
  batching: true,
  interval: 5, // seconds
  host: process.env.LOKI_HOST || 'http://localhost:3100',
  labels: {
    app: 'scoms-backend',
    env: process.env.NODE_ENV || 'development',
    custom_tag: process.env.LOG_CUSTOM_TAG || 'default-value', // <-- custom tag for filtering
  },
};

const streams = [
  { stream: process.stdout },
  { stream: createWriteStream(lokiOptions) },
];

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'scoms-backend',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
}, pino.multistream(streams));

export default logger;
