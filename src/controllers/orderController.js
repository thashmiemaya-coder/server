import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import { sendEmail, templates } from '../utils/sendEmail.js';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import Coupon from '../models/Coupon.js';

const SHIPPING_FLAT = 5;
const TAX_RATE = 0.05;

// Recompute prices server-side from DB to prevent tampering.
const buildOrderTotals = async (items, couponCode) => {
  let itemsPrice = 0;
  const orderItems = [];

  for (const it of items) {
    const book = await Book.findById(it.book);
    if (!book || !book.isActive) throw new ErrorResponse(`Book unavailable: ${it.book}`, 400);
    if (book.stock < it.quantity) throw new ErrorResponse(`Insufficient stock for ${book.title}`, 400);
    const price = book.effectivePrice;
    itemsPrice += price * it.quantity;
    orderItems.push({
      book: book._id,
      title: book.title,
      author: book.author,
      image: book.coverImage,
      price,
      quantity: it.quantity,
    });
  }

  let discount = 0;
  let appliedCoupon;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon) {
      const err = coupon.isValid(itemsPrice);
      if (err) throw new ErrorResponse(err, 400);
      discount = coupon.computeDiscount(itemsPrice);
      appliedCoupon = coupon;
    }
  }

  const taxable = Math.max(0, itemsPrice - discount);
  const taxPrice = Math.round(taxable * TAX_RATE * 100) / 100;
  const shippingPrice = itemsPrice > 50 ? 0 : SHIPPING_FLAT;
  const totalPrice = Math.round((taxable + taxPrice + shippingPrice) * 100) / 100;

  return { orderItems, itemsPrice, discount, taxPrice, shippingPrice, totalPrice, appliedCoupon };
};

// @route POST /api/v1/orders
export const createOrder = asyncHandler(async (req, res, next) => {
  const { orderItems: items, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!items?.length) return next(new ErrorResponse('No order items', 400));

  const totals = await buildOrderTotals(items, couponCode);

  const order = await Order.create({
    user: req.user._id,
    orderItems: totals.orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'stripe',
    itemsPrice: totals.itemsPrice,
    discount: totals.discount,
    taxPrice: totals.taxPrice,
    shippingPrice: totals.shippingPrice,
    totalPrice: totals.totalPrice,
    couponCode: couponCode?.toUpperCase(),
    isPaid: paymentMethod === 'cod' ? false : false,
  });

  // Decrement stock + bump sold
  for (const it of totals.orderItems) {
    await Book.findByIdAndUpdate(it.book, { $inc: { stock: -it.quantity, sold: it.quantity } });
  }
  if (totals.appliedCoupon) {
    await Coupon.findByIdAndUpdate(totals.appliedCoupon._id, { $inc: { usedCount: 1 } });
  }

  sendEmail({
    to: req.user.email,
    subject: 'Your BookHaven order is confirmed',
    html: templates.orderConfirmation(req.user.name, order),
  }).catch(() => {});

  res.status(201).json({ success: true, order });
});

// @route GET /api/v1/orders/my
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, count: orders.length, orders });
});

// @route GET /api/v1/orders/:id
export const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return next(new ErrorResponse('Order not found', 404));
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }
  res.json({ success: true, order });
});

// @route GET /api/v1/orders  (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  const orders = await Order.find(filter).populate('user', 'name email').sort('-createdAt');
  const revenue = orders.filter((o) => o.isPaid).reduce((s, o) => s + o.totalPrice, 0);
  res.json({ success: true, count: orders.length, revenue, orders });
});

// @route PUT /api/v1/orders/:id/status  (admin)
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return next(new ErrorResponse('Order not found', 404));

  order.orderStatus = status;
  order.trackingHistory.push({ status, note });
  if (status === 'Delivered') {
    order.deliveredAt = Date.now();
    if (order.paymentMethod === 'cod') order.isPaid = true;
  }
  await order.save();

  sendEmail({
    to: order.user.email,
    subject: `Order ${status} — BookHaven`,
    html: templates.orderStatus(order.user.name, order),
  }).catch(() => {});

  res.json({ success: true, order });
});

// @route PUT /api/v1/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse('Order not found', 404));
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }
  if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
    return next(new ErrorResponse('Cannot cancel a shipped/delivered order', 400));
  }
  order.orderStatus = 'Cancelled';
  order.trackingHistory.push({ status: 'Cancelled', note: 'Cancelled by ' + req.user.role });
  // restock
  for (const it of order.orderItems) {
    await Book.findByIdAndUpdate(it.book, { $inc: { stock: it.quantity, sold: -it.quantity } });
  }
  await order.save();
  res.json({ success: true, order });
});
