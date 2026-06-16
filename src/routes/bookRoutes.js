import { Router } from 'express';
import {
  getBooks, getBook, getFeatured, getBestSellers, createBook, updateBook, deleteBook,
} from '../controllers/bookController.js';
import { createReview, getBookReviews } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();
router.get('/', getBooks);
router.get('/featured', getFeatured);
router.get('/bestsellers', getBestSellers);
router.get('/:slug', getBook);

// reviews nested under a book id
router.get('/:bookId/reviews', getBookReviews);
router.post('/:bookId/reviews', protect, createReview);

// admin
router.post('/', protect, authorize('admin'), upload.array('images', 5), createBook);
router.put('/:id', protect, authorize('admin'), upload.array('images', 5), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

export default router;
