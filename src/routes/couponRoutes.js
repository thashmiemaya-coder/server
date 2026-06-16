import { Router } from 'express';
import {
  applyCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon,
} from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.post('/apply', protect, applyCoupon);
router.use(protect, authorize('admin'));
router.get('/', getCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);
export default router;
