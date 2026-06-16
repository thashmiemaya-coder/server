import jwt from 'jsonwebtoken';

export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

/**
 * Signs a JWT, sets it as an httpOnly cookie, and returns the sanitized user + token.
 */
export const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRE || 7);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
  });

  const safeUser = user.toObject ? user.toObject() : user;
  delete safeUser.password;

  res.status(statusCode).json({ success: true, token, user: safeUser });
};
