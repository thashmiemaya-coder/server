import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import bookRoutes from './routes/bookRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://book-heaven-frontend-pink.vercel.app',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowedOrigin = allowedOrigins.includes(origin);

      const isBookHeavenVercelDeployment =
        origin.startsWith('https://book-heaven-frontend-') &&
        origin.endsWith('.vercel.app');

      if (isAllowedOrigin || isBookHeavenVercelDeployment) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('BookHaven API is running');
});

app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/orders', orderRoutes);

export default app;