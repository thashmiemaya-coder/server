import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import Contact from '../models/Contact.js';

export const submitContact = asyncHandler(async (req, res) => {
  const msg = await Contact.create(req.body);
  res.status(201).json({ success: true, message: 'Message received. We will reply soon.', id: msg._id });
});

// admin
export const getMessages = asyncHandler(async (_req, res) => {
  const messages = await Contact.find().sort('-createdAt');
  res.json({ success: true, count: messages.length, messages });
});
export const updateMessageStatus = asyncHandler(async (req, res, next) => {
  const msg = await Contact.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!msg) return next(new ErrorResponse('Message not found', 404));
  res.json({ success: true, message: msg });
});
export const deleteMessage = asyncHandler(async (req, res, next) => {
  const msg = await Contact.findByIdAndDelete(req.params.id);
  if (!msg) return next(new ErrorResponse('Message not found', 404));
  res.json({ success: true, message: 'Deleted' });
});
