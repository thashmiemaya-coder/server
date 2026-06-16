import { Router } from 'express';
import { getStats, getSalesReport } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/stats', getStats);
router.get('/sales', getSalesReport);
export default router;
