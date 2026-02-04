import express from 'express';
import { getTopProducts } from '../services/accesstradeClient.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { date_from, date_to, merchant } = req.query;
    // Default to shopee for this app
    const products = await getTopProducts({
      dateFrom: date_from,
      dateTo: date_to,
      merchant: merchant || 'shopee'
    });
    res.json({ data: products });
  } catch (err) {
    console.error('Error in /api/top-products:', err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Failed to fetch top products'
    });
  }
});

export default router;
