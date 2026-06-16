import crypto from 'crypto';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import { sendEmail, templates } from '../utils/sendEmail.js';
import Newsletter from '../models/Newsletter.js';

export const subscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorResponse('Email is required', 400));
  let sub = await Newsletter.findOne({ email });
  if (sub?.isSubscribed) return next(new ErrorResponse('Already subscribed', 400));
  if (sub) {
    sub.isSubscribed = true;
    await sub.save();
  } else {
    sub = await Newsletter.create({ email, unsubscribeToken: crypto.randomBytes(16).toString('hex') });
  }
  res.status(201).json({ success: true, message: 'Subscribed to BookHaven newsletter' });
});

export const unsubscribe = asyncHandler(async (req, res) => {
  await Newsletter.findOneAndUpdate({ unsubscribeToken: req.params.token }, { isSubscribed: false });
  res.json({ success: true, message: 'Unsubscribed' });
});

// admin
export const getSubscribers = asyncHandler(async (_req, res) => {
  const subscribers = await Newsletter.find().sort('-createdAt');
  res.json({ success: true, count: subscribers.length, subscribers });
});

export const broadcast = asyncHandler(async (req, res) => {
  const { subject, content } = req.body;
  const subs = await Newsletter.find({ isSubscribed: true }).select('email');
  await Promise.allSettled(
    subs.map((s) => sendEmail({ to: s.email, subject, html: templates.newsletter(subject, content) }))
  );
  res.json({ success: true, message: `Broadcast sent to ${subs.length} subscribers` });
});
