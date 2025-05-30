import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Warehouse } from '../models/Warehouse';
import { Order } from '../models/Order';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV === 'test', // auto-create tables in test env
  logging: true,
  entities: [Warehouse, Order], // Add entity files here
  migrations: [],
  subscribers: [],
});
