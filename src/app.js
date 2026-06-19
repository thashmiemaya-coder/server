import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

import routes from './routes/index.js';
import { stripeWebhook } from './controllers/paymentController.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Stripe webhook needs the raw body, so it is mounted BEFORE express.json()
app.post('/api/v1/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Core middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());
app.use(
  cors({
    origin: 'book-heaven-frontend-bojjydmr9-thashmiemaya-coders-projects.vercel.app',
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'BookHaven API' }));

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
