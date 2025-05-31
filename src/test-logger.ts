// Test script to demonstrate colored logging
import logger from './utils/logger';

// Set environment variable to development to enable colorized output
process.env.NODE_ENV = 'development';

// Set log level to trace to show all log levels
process.env.LOG_LEVEL = 'trace';

// Log messages at different levels
logger.trace('This is a TRACE level message (magenta)');
logger.debug('This is a DEBUG level message (cyan)');
logger.info('This is an INFO level message (green)');
logger.warn('This is a WARN level message (yellow)');
logger.error('This is an ERROR level message (red)');
logger.fatal('This is a FATAL level message (red background)');

// Log with additional context
logger.info({ orderId: '12345', user: 'customer@example.com' }, 'Order processed successfully');
logger.error(
  {
    orderId: '67890',
    error: new Error('Invalid product ID'),
  },
  'Failed to process order'
);

// Example of child logger with component context
const orderLogger = logger.child({ component: 'OrderService' });
orderLogger.info('Processing new order');
orderLogger.warn({ orderId: 'ORD-9999' }, 'Order is missing shipping information');

// eslint-disable-next-line no-console
console.log('\nCheck the different colors in the log output above!');
