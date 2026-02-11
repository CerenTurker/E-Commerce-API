import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategory);

// Admin/Seller routes
router.post('/', authenticate, authorize('ADMIN', 'SELLER'), createCategory);
router.put('/:id', authenticate, authorize('ADMIN', 'SELLER'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
