import orderRoutes from './orderRoutes';
import warehouseRoutes from './warehouseRoutes';
import { Router } from 'express';

const router = Router();

router.use('/api/v1/orders', orderRoutes);
router.use('/api/v1/warehouses', warehouseRoutes);

export default router;