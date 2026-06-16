import { Router } from 'express';
import { getAllReviews, toggleApproval, deleteReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.delete('/:id', deleteReview); // owner or admin (checked in controller)
router.get('/', authorize('admin'), getAllReviews);
router.put('/:id/approve', authorize('admin'), toggleApproval);
export default router;
