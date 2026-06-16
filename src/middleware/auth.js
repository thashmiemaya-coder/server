import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import User from '../models/User.js';

// Verifies JWT from cookie or Authorization header and attaches req.user.
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return next(new ErrorResponse('Not authorized — please log in', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(new ErrorResponse('User no longer exists', 401));
    req.user = user;
    next();
  } catch {
    return next(new ErrorResponse('Invalid or expired token', 401));
  }
});

// Role-based access control. Usage: authorize('admin')
export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ErrorResponse(`Role '${req.user.role}' is not allowed to access this resource`, 403));
  }
  next();
};
