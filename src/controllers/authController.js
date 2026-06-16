import crypto from 'crypto';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import { sendTokenResponse } from '../utils/generateToken.js';
import { sendEmail, templates } from '../utils/sendEmail.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import User from '../models/User.js';

// @route POST /api/v1/auth/register
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return next(new ErrorResponse('Email already registered', 400));

  const user = await User.create({ name, email: normalizedEmail, password });
  sendEmail({ to: normalizedEmail, subject: 'Welcome to BookHaven', html: templates.welcome(name) }).catch(() => {});
  sendTokenResponse(user, 201, res);
});

// @route POST /api/v1/auth/login  (shared by customers AND admins)
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password) return next(new ErrorResponse('Provide email and password', 400));

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  if (!user.isActive) return next(new ErrorResponse('Account is deactivated', 403));

  // Front-end reads user.role to redirect admins to the dashboard.
  sendTokenResponse(user, 200, res);
});

// @route GET /api/v1/auth/logout
export const logout = asyncHandler(async (_req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 5 * 1000), httpOnly: true });
  res.json({ success: true, message: 'Logged out' });
});

// @route GET /api/v1/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route PUT /api/v1/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const fields = (({ name, phone }) => ({ name, phone }))(req.body);

  if (req.file) {
    if (req.user.avatar?.public_id) await deleteFromCloudinary(req.user.avatar.public_id);
    fields.avatar = await uploadToCloudinary(req.file.buffer, 'bookhaven/avatars');
  }

  const user = await User.findByIdAndUpdate(req.user._id, fields, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user });
});

// @route PUT /api/v1/auth/password
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }
  user.password = newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
});

// @route POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse('No user with that email', 404));

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL?.split(',')[0]}/reset-password/${resetToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'BookHaven Password Reset',
      html: templates.resetPassword(user.name, resetUrl),
    });
    res.json({ success: true, message: 'Reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @route PUT /api/v1/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) return next(new ErrorResponse('Invalid or expired reset token', 400));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
});

// ---- Address book ----
// @route POST /api/v1/auth/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

// @route DELETE /api/v1/auth/addresses/:id
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});
