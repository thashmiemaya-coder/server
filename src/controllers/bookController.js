import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import Book from '../models/Book.js';
import Review from '../models/Review.js';

// @route GET /api/v1/books
export const getBooks = asyncHandler(async (req, res) => {
  const base = { isActive: true };

  // Resolve category slug -> applied directly via query if ObjectId passed
  const features = new ApiFeatures(Book.find(base).populate('category', 'name slug'), req.query)
    .search()
    .filter()
    .sort()
    .paginate(Number(req.query.limit) || 12);

  const books = await features.query;

  // total count for pagination (re-run filter without pagination)
  const countFeatures = new ApiFeatures(Book.find(base), req.query).search().filter();
  const total = await countFeatures.query.countDocuments();

  res.json({
    success: true,
    count: books.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    books,
  });
});

// @route GET /api/v1/books/featured
export const getFeatured = asyncHandler(async (_req, res) => {
  const books = await Book.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .limit(8);
  res.json({ success: true, books });
});

// @route GET /api/v1/books/bestsellers
export const getBestSellers = asyncHandler(async (_req, res) => {
  const books = await Book.find({ isActive: true })
    .sort('-sold -ratings')
    .limit(8)
    .populate('category', 'name slug');
  res.json({ success: true, books });
});

// @route GET /api/v1/books/:slug
export const getBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findOne({ slug: req.params.slug }).populate('category', 'name slug');
  if (!book) return next(new ErrorResponse('Book not found', 404));

  const reviews = await Review.find({ book: book._id, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt');

  const related = await Book.find({
    category: book.category._id,
    _id: { $ne: book._id },
    isActive: true,
  })
    .limit(4)
    .select('title author slug price discountPrice coverImage ratings');

  res.json({ success: true, book, reviews, related });
});

// @route POST /api/v1/books  (admin)
export const createBook = asyncHandler(async (req, res) => {
  const images = [];
  if (req.files?.length) {
    for (const file of req.files) {
      images.push(await uploadToCloudinary(file.buffer, 'bookhaven/books'));
    }
  }
  const book = await Book.create({
    ...req.body,
    images,
    coverImage: images[0]?.url || req.body.coverImage || '',
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, book });
});

// @route PUT /api/v1/books/:id  (admin)
export const updateBook = asyncHandler(async (req, res, next) => {
  let book = await Book.findById(req.params.id);
  if (!book) return next(new ErrorResponse('Book not found', 404));

  if (req.files?.length) {
    for (const img of book.images) await deleteFromCloudinary(img.public_id);
    const images = [];
    for (const file of req.files) images.push(await uploadToCloudinary(file.buffer, 'bookhaven/books'));
    req.body.images = images;
    req.body.coverImage = images[0]?.url;
  }

  Object.assign(book, req.body);
  await book.save();
  res.json({ success: true, book });
});

// @route DELETE /api/v1/books/:id  (admin)
export const deleteBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) return next(new ErrorResponse('Book not found', 404));
  for (const img of book.images) await deleteFromCloudinary(img.public_id);
  await book.deleteOne();
  res.json({ success: true, message: 'Book deleted' });
});
