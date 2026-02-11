import { Router } from 'express';
import {
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  getAllUsers,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN')); // All admin routes require ADMIN role

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrderStatus);
router.get('/users', getAllUsers);

export default router;
