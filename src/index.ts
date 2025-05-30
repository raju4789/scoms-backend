import express from 'express';
import dotenv from 'dotenv';
import { Client } from 'pg';
import logger from '../utils/logger';

dotenv.config();

const app = express();
const port = 3000;

const dbClient = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

dbClient.connect()
  .then(() => logger.info('Connected to PostgreSQL'))
  .catch((err: Error) => logger.error({ err }, 'PostgreSQL connection error'));

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
