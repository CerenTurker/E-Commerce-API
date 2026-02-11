import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate); // All wishlist routes require authentication

router.get('/', getWishlist);
router.post('/items', addToWishlist);
router.delete('/items/:itemId', removeFromWishlist);
router.delete('/', clearWishlist);

export default router;
