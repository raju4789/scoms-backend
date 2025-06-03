import { Client } from 'pg';
import logger from './logger';
import { seedInitialWarehousesIfEmpty } from './seedWarehouses';

export async function connectDB(config: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) {
  const dbClient = new Client(config);
  try {
    await dbClient.connect();
    logger.info('Connected to PostgreSQL');
  } catch (err) {
    logger.error('PostgreSQL connection error', { err });
    throw err;
  }
  return dbClient;
}

export async function runInitialDataLoad() {
  await seedInitialWarehousesIfEmpty();
}
