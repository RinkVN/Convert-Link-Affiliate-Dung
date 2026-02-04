import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDb } from './config/db.js';
import { loadShopeeDatafeed } from './services/shopeeDatafeed.js';
import convertRouter, { renderLinkHandler } from './routes/convert.js';
import topProductsRouter from './routes/topProducts.js';
import eventsRouter from './routes/events.js';
import adminRouter from './routes/admin.js';
import redirectRouter from './routes/redirect.js';

const app = express();

// Basic security & logging
app.use(helmet());
app.use(morgan('dev'));

// CORS - allowlist: 1 cho dev, 1 cho prod
const allowedOrigins = [
  process.env.CLIENT_ORIGIN_DEV,
  process.env.CLIENT_ORIGIN_PROD,
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Cho phép request không có Origin (curl, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parser
app.use(express.json());

// Rate limiting for /api/convert
const convertLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per window per IP
  message: {
    error: 'Too many requests. Please try again later.'
  },
  keyGenerator: (req) => req.ip
});

app.use('/api/convert', convertLimiter, convertRouter);
app.get('/render-link', convertLimiter, renderLinkHandler);
app.use('/api/top-products', topProductsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);
app.use('/r', redirectRouter);

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDb();
    await loadShopeeDatafeed();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

