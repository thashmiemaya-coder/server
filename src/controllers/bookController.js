import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import ApiFeatures from '../utils/ApiFeatures.js';

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary.js';

import Book from '../models/Book.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';

// Category import එක direct use නොකළත්,
// Mongoose Category model එක register කිරීමට අවශ්‍යයි.
void Category;

// @desc    Get all active books
// @route   GET /api/v1/books
// @access  Public
export const getBooks = asyncHandler(async (req, res) => {
  const baseQuery = {
    isActive: true,
  };

  const features = new ApiFeatures(
    Book.find(baseQuery).populate('category', 'name slug'),
    req.query
  )
    .search()
    .filter()
    .sort()
    .paginate(Number(req.query.limit) || 12);

  const books = await features.query;

  const countFeatures = new ApiFeatures(
    Book.find(baseQuery),
    req.query
  )
    .search()
    .filter();

  const total = await countFeatures.query.countDocuments();

  res.status(200).json({
    success: true,
    count: books.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    books,
  });
});

// @desc    Get featured books
// @route   GET /api/v1/books/featured
// @access  Public
export const getFeatured = asyncHandler(async (_req, res) => {
  const books = await Book.find({
    isActive: true,
    isFeatured: true,
  })
    .populate('category', 'name slug')
    .limit(8);

  res.status(200).json({
    success: true,
    books,
  });
});

// @desc    Get bestselling books
// @route   GET /api/v1/books/bestsellers
// @access  Public
export const getBestSellers = asyncHandler(async (_req, res) => {
  const books = await Book.find({
    isActive: true,
  })
    .sort('-sold -ratings')
    .limit(8)
    .populate('category', 'name slug');

  res.status(200).json({
    success: true,
    books,
  });
});

// @desc    Get a single book by slug
// @route   GET /api/v1/books/:slug
// @access  Public
export const getBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate('category', 'name slug');

  if (!book) {
    return next(new ErrorResponse('Book not found', 404));
  }

  const reviews = await Review.find({
    book: book._id,
    isApproved: true,
  })
    .populate('user', 'name avatar')
    .sort('-createdAt');

  const categoryId = book.category?._id || book.category;

  const related = await Book.find({
    category: categoryId,
    _id: {
      $ne: book._id,
    },
    isActive: true,
  })
    .limit(4)
    .select(
      'title author slug price discountPrice coverImage ratings'
    );

  res.status(200).json({
    success: true,
    book,
    reviews,
    related,
  });
});

// @desc    Create a new book
// @route   POST /api/v1/books
// @access  Admin
export const createBook = asyncHandler(async (req, res, next) => {
  const categoryExists = await Category.findById(req.body.category);

  if (!categoryExists) {
    return next(new ErrorResponse('Category not found', 404));
  }

  const images = [];

  if (req.files?.length) {
    for (const file of req.files) {
      const uploadedImage = await uploadToCloudinary(
        file.buffer,
        'bookhaven/books'
      );

      images.push(uploadedImage);
    }
  }

  const book = await Book.create({
    ...req.body,
    images,
    coverImage:
      images[0]?.url ||
      req.body.coverImage ||
      '',
    createdBy: req.user._id,
  });

  const populatedBook = await Book.findById(book._id).populate(
    'category',
    'name slug'
  );

  res.status(201).json({
    success: true,
    book: populatedBook,
  });
});

// @desc    Update a book
// @route   PUT /api/v1/books/:id
// @access  Admin
export const updateBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new ErrorResponse('Book not found', 404));
  }

  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);

    if (!categoryExists) {
      return next(new ErrorResponse('Category not found', 404));
    }
  }

  if (req.files?.length) {
    if (book.images?.length) {
      for (const image of book.images) {
        if (image.public_id) {
          await deleteFromCloudinary(image.public_id);
        }
      }
    }

    const images = [];

    for (const file of req.files) {
      const uploadedImage = await uploadToCloudinary(
        file.buffer,
        'bookhaven/books'
      );

      images.push(uploadedImage);
    }

    req.body.images = images;
    req.body.coverImage = images[0]?.url || '';
  }

  Object.assign(book, req.body);
  await book.save();

  const updatedBook = await Book.findById(book._id).populate(
    'category',
    'name slug'
  );

  res.status(200).json({
    success: true,
    book: updatedBook,
  });
});

// @desc    Delete a book
// @route   DELETE /api/v1/books/:id
// @access  Admin
export const deleteBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new ErrorResponse('Book not found', 404));
  }

  if (book.images?.length) {
    for (const image of book.images) {
      if (image.public_id) {
        await deleteFromCloudinary(image.public_id);
      }
    }
  }

  await book.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Book deleted successfully',
  });
});