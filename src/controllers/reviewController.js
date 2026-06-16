import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

// @route POST /api/v1/books/:bookId/reviews
export const createReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;
  const { bookId } = req.params;

  const exists = await Review.findOne({ book: bookId, user: req.user._id });
  if (exists) return next(new ErrorResponse('You already reviewed this book', 400));

  // Optional: verified-purchase gate
  const purchased = await Order.exists({ user: req.user._id, 'orderItems.book': bookId, isPaid: true });

  const review = await Review.create({
    book: bookId,
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
    isApproved: !!purchased || true, // auto-approve; flip to require moderation
  });
  res.status(201).json({ success: true, review });
});

export const getBookReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt');
  res.json({ success: true, count: reviews.length, reviews });
});

export const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new ErrorResponse('Review not found', 404));
  // Owner or admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
});

// admin
export const getAllReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name')
    .populate('book', 'title')
    .sort('-createdAt');
  res.json({ success: true, count: reviews.length, reviews });
});

export const toggleApproval = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new ErrorResponse('Review not found', 404));
  review.isApproved = !review.isApproved;
  await review.save();
  res.json({ success: true, review });
});
