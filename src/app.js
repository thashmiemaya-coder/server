const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://book-heaven-frontend-pink.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
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
