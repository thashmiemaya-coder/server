import { Router } from 'express';
import {
  subscribe, unsubscribe, getSubscribers, broadcast,
} from '../controllers/newsletterController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.post('/subscribe', subscribe);
router.get('/unsubscribe/:token', unsubscribe);
router.get('/', protect, authorize('admin'), getSubscribers);
router.post('/broadcast', protect, authorize('admin'), broadcast);
export default router;
