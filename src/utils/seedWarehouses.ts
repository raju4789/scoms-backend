import { createWarehouse } from '../services/warehouseService';
import { getWarehouses } from '../repositories/warehouseRepository';
import logger from '../utils/logger';

const initialWarehouses = [
  { name: 'Los Angeles', latitude: 33.9425, longitude: -118.408056, stock: 355 },
  { name: 'New York', latitude: 40.639722, longitude: -73.778889, stock: 578 },
  { name: 'São Paulo', latitude: -23.435556, longitude: -46.473056, stock: 265 },
  { name: 'Paris', latitude: 49.009722, longitude: 2.547778, stock: 694 },
  { name: 'Warsaw', latitude: 52.165833, longitude: 20.967222, stock: 245 },
  { name: 'Hong Kong', latitude: 22.308889, longitude: 113.914444, stock: 419 },
];

export async function seedInitialWarehousesIfEmpty() {
  try {
    const warehouses = await getWarehouses();
    if (warehouses.length === 0) {
      for (const wh of initialWarehouses) {
        await createWarehouse(wh);
        logger.info(`Seeded warehouse: ${wh.name}`);
      }
      logger.info('Initial warehouses seeded.');
    } else {
      logger.info('Warehouses already exist, skipping seed.');
    }
  } catch (e) {
    logger.error('Error during warehouse seeding', { error: e });
  }
}
