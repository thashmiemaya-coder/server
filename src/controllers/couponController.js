import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import Coupon from '../models/Coupon.js';

// public: validate a coupon against a subtotal
export const applyCoupon = asyncHandler(async (req, res, next) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase() });
  if (!coupon) return next(new ErrorResponse('Invalid coupon code', 404));
  const err = coupon.isValid(Number(subtotal) || 0);
  if (err) return next(new ErrorResponse(err, 400));
  const discount = coupon.computeDiscount(Number(subtotal) || 0);
  res.json({ success: true, code: coupon.code, discount, discountType: coupon.discountType });
});

// admin CRUD
export const getCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
});
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});
export const updateCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return next(new ErrorResponse('Coupon not found', 404));
  res.json({ success: true, coupon });
});
export const deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new ErrorResponse('Coupon not found', 404));
  res.json({ success: true, message: 'Coupon deleted' });
});
