import express from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger';
import router from './routes';
import { AppError } from './errors/AppError';
import { errorResponse } from './types/CommonApiResponse';
import { AppDataSource } from './config/data-source';
import { runInitialDataLoad } from './utils/dbBootstrap';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(router);

(async () => {
  try {
    await AppDataSource.initialize();
    logger.info('TypeORM DataSource initialized');
    await runInitialDataLoad();
  } catch (err) {
    logger.error({ err }, 'TypeORM initialization or seeding failed');
    process.exit(1);
  }

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Global error handler middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof AppError) {
      res.status(400).json(errorResponse(400, err.message));
    } else {
      res.status(500).json(errorResponse(500, err.message || 'Internal Server Error'));
    }
  });

  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
})();
