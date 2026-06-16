import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus, cancelOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/', authorize('admin'), getAllOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
export default router;
