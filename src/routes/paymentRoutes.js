import { Router } from 'express';
import { createPaymentIntent, confirmPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
// /webhook is mounted in app.js (needs raw body)
export default router;
