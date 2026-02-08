import express from 'express';
import { searchCoupons } from '../services/meilisearchService.js';

const router = express.Router();

function toApiCoupon(doc) {
  const obj = doc;
  return {
    id: obj.accesstradeId || obj._id?.toString(),
    name: obj.name,
    merchant: obj.merchant,
    image: obj.image,
    aff_link: obj.prod_link || obj.link,
    link: obj.link,
    prod_link: obj.prod_link,
    content: obj.content,
    discount_value: obj.discount_value,
    discount_percentage: obj.discount_percentage,
    end_date: obj.end_date,
    coupons: obj.coupons,
    is_hot: obj.is_hot
  };
}

/**
 * GET /api/search
 * Tìm kiếm coupon qua Meilisearch (typo, prefix, synonyms, ranking)
 *
 * Query: q, page, limit, domain, is_next_day_coupon, merchant
 */
router.get('/', async (req, res) => {
  try {
    const { q, page, limit, domain, is_next_day_coupon, merchant } = req.query;

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));

    const filters = {};
    if (domain) filters.domain = String(domain).trim();
    if (is_next_day_coupon !== undefined) {
      filters.isNextDayCoupon = String(is_next_day_coupon).toLowerCase() === 'true';
    }
    if (merchant) filters.merchant = String(merchant).trim();

    const result = await searchCoupons({
      q: q ? String(q).trim() : '',
      page: parsedPage,
      limit: parsedLimit,
      filters
    });

    const data = result.data.map(toApiCoupon);

    res.json({
      data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (err) {
    console.error('Error in /api/search:', err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Search failed'
    });
  }
});

export default router;
