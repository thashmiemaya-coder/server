import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import User from '../models/User.js';

// admin
export const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.keyword)
    filter.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { email: { $regex: req.query.keyword, $options: 'i' } },
    ];
  const users = await User.find(filter).sort('-createdAt');
  res.json({ success: true, count: users.length, users });
});

export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.json({ success: true, user });
});

export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) return next(new ErrorResponse('Invalid role', 400));
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.json({ success: true, user });
});

export const toggleUserActive = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.json({ success: true, message: 'User deleted' });
});
