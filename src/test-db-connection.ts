import { AppDataSource } from '../config/data-source';
import logger from '../utils/logger';

AppDataSource.initialize()
  .then(() => {
    logger.info('Database connection successful!');
    logger.info({ orderId: 'ghjdgfuighefj' }, 'Database connection successful with orderId'); // Correct usage for custom tag
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, 'Database connection failed');
    process.exit(1);
  });
