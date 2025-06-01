import healthRoutes from './healthRoutes';
import orderRoutes from './orderRoutes';
import warehouseRoutes from './warehouseRoutes';
import { Router } from 'express';

const router = Router();

router.use('/', healthRoutes);
router.use('/orders', orderRoutes);
router.use('/warehouses', warehouseRoutes);

export default router;
