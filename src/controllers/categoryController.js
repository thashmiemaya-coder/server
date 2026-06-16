import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import Category from '../models/Category.js';
import Book from '../models/Book.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json({ success: true, categories });
});

export const getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return next(new ErrorResponse('Category not found', 404));
  res.json({ success: true, category });
});

export const createCategory = asyncHandler(async (req, res) => {
  if (req.file) req.body.image = await uploadToCloudinary(req.file.buffer, 'bookhaven/categories');
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
  if (req.file) req.body.image = await uploadToCloudinary(req.file.buffer, 'bookhaven/categories');
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return next(new ErrorResponse('Category not found', 404));
  res.json({ success: true, category });
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const inUse = await Book.countDocuments({ category: req.params.id });
  if (inUse) return next(new ErrorResponse(`Cannot delete: ${inUse} books use this category`, 400));
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new ErrorResponse('Category not found', 404));
  res.json({ success: true, message: 'Category deleted' });
});
