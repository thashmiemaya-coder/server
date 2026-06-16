import Stripe from 'stripe';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import Order from '../models/Order.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// @route POST /api/v1/payment/create-intent
export const createPaymentIntent = asyncHandler(async (req, res, next) => {
  if (!stripe) return next(new ErrorResponse('Stripe is not configured', 500));
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new ErrorResponse('Order not found', 404));
  if (order.user.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100), // cents
    currency: 'usd',
    metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
    automatic_payment_methods: { enabled: true },
  });

  res.json({ success: true, clientSecret: paymentIntent.client_secret });
});

// @route POST /api/v1/payment/webhook  (raw body, mounted in app.js)
export const stripeWebhook = asyncHandler(async (req, res) => {
  if (!stripe) return res.status(500).end();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const order = await Order.findById(intent.metadata.orderId);
    if (order && !order.isPaid) {
      order.isPaid = true;
      order.orderStatus = 'Confirmed';
      order.paymentResult = { id: intent.id, status: intent.status, paidAt: new Date() };
      order.trackingHistory.push({ status: 'Confirmed', note: 'Payment received' });
      await order.save();
    }
  }
  res.json({ received: true });
});

// Fallback for clients without webhooks (e.g. local dev): confirm by intent id.
// @route POST /api/v1/payment/confirm
export const confirmPayment = asyncHandler(async (req, res, next) => {
  if (!stripe) return next(new ErrorResponse('Stripe is not configured', 500));
  const { orderId, paymentIntentId } = req.body;
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded') return next(new ErrorResponse('Payment not completed', 400));

  const order = await Order.findById(orderId);
  if (!order) return next(new ErrorResponse('Order not found', 404));
  order.isPaid = true;
  order.orderStatus = 'Confirmed';
  order.paymentResult = { id: intent.id, status: intent.status, paidAt: new Date() };
  await order.save();
  res.json({ success: true, order });
});
