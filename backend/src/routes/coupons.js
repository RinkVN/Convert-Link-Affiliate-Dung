import express from 'express';
import { Coupon } from '../models/Coupon.js';

const router = express.Router();

const MAX_LIMIT = 50;

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tạo filter tìm kiếm gần đúng: tên, nội dung, mã coupon, mô tả
 * Mỗi từ trong query phải xuất hiện ít nhất 1 trong các trường
 */
function buildSearchFilter(q) {
  const trimmed = String(q || '').trim();
  if (!trimmed) return null;

  const words = trimmed
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  if (words.length === 0) return null;

  const searchFields = [
    { name: { $regex: null, $options: 'i' } },
    { content: { $regex: null, $options: 'i' } },
    { 'coupons.coupon_desc': { $regex: null, $options: 'i' } },
    { 'coupons.coupon_code': { $regex: null, $options: 'i' } },
    { merchant: { $regex: null, $options: 'i' } }
  ];

  const andConditions = words.map((word) => {
    const regex = new RegExp(escapeRegex(word), 'i');
    const orConditions = searchFields.map((f) => {
      const key = Object.keys(f)[0];
      return { [key]: { $regex: regex.source, $options: 'i' } };
    });
    return { $or: orConditions };
  });

  return { $and: andConditions };
}

/**
 * Chuyển doc DB sang format frontend (id, aff_link từ prod_link)
 */
function toApiCoupon(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
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

// GET /api/coupons/pinned - Lấy N coupons đầu tiên trong DB (theo _id) khi chưa search/filter
router.get('/pinned', async (req, res) => {
  try {
    const domain = (req.query.domain || 'shopee.vn').toString().trim();
    const limit = Math.min(Number(req.query.limit) || 5, 10);
    const isNextDay =
      typeof req.query.is_next_day_coupon === 'string'
        ? req.query.is_next_day_coupon.toLowerCase() === 'true'
        : false;

    const filter = { domain, isNextDayCoupon: isNextDay };
    const items = await Coupon.find(filter)
      .sort({ _id: 1 })
      .limit(limit)
      .lean();

    const data = items.map((doc) => toApiCoupon(doc));
    res.json({ data });
  } catch (err) {
    console.error('Error in /api/coupons/pinned:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch pinned coupons' });
  }
});

// GET /api/coupons
// Lấy danh sách mã khuyến mại từ DB (đã sync từ ACCESSTRADE qua cron)
// Phân quyền:
// - FREE: luôn giới hạn limit nhỏ và chỉ cho xem 1 trang đầu tiên
// - PAID: cho phép phân trang đầy đủ theo page/limit/filters
router.get('/', async (req, res) => {
  try {
    const {
      is_next_day_coupon,
      domain,
      limit,
      page,
      skip_first,
      q,
      coupon_type,
      discount_value_min,
      discount_value_max,
      discount_percentage_min,
      discount_percentage_max,
      sort
    } = req.query;

    let parsedLimit = limit ? Number(limit) : undefined;
    let parsedPage = page ? Number(page) : undefined;

    if (Number.isNaN(parsedLimit)) parsedLimit = undefined;
    if (Number.isNaN(parsedPage)) parsedPage = undefined;

    parsedLimit = Math.min(parsedLimit || MAX_LIMIT, MAX_LIMIT);
    parsedPage = parsedPage && parsedPage > 0 ? parsedPage : 1;
    const skipFirst = Math.max(0, Number(skip_first) || 0);

    const dom = (domain || 'shopee.vn').toString().trim();
    const isNextDay =
      typeof is_next_day_coupon === 'boolean'
        ? is_next_day_coupon
        : typeof is_next_day_coupon === 'string'
          ? is_next_day_coupon.toLowerCase() === 'true'
          : false;

    const filter = { domain: dom, isNextDayCoupon: isNextDay };

    // Tìm kiếm gần đúng: tên, nội dung, mã, mô tả
    const searchFilter = buildSearchFilter(q);
    if (searchFilter) {
      filter.$and = filter.$and || [];
      filter.$and.push(searchFilter);
    }

    // Filter: loại coupon (value=giảm tiền, percent=giảm %, hot=mã hot)
    if (coupon_type === 'value') {
      filter.discount_value = Object.assign({}, filter.discount_value || {}, { $gt: 0 });
    } else if (coupon_type === 'percent') {
      filter.discount_percentage = Object.assign({}, filter.discount_percentage || {}, { $gt: 0 });
    } else if (coupon_type === 'hot') {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ is_hot: 'True' }, { is_hot: true }] });
    }

    // Filter: giá trị khuyến mãi
    if (discount_value_min != null && discount_value_min !== '') {
      const v = Number(discount_value_min);
      if (!Number.isNaN(v)) {
        filter.discount_value = filter.discount_value || {};
        filter.discount_value.$gte = v;
      }
    }
    if (discount_value_max != null && discount_value_max !== '') {
      const v = Number(discount_value_max);
      if (!Number.isNaN(v)) {
        filter.discount_value = filter.discount_value || {};
        filter.discount_value.$lte = v;
      }
    }
    if (discount_percentage_min != null && discount_percentage_min !== '') {
      const v = Number(discount_percentage_min);
      if (!Number.isNaN(v)) {
        filter.discount_percentage = filter.discount_percentage || {};
        filter.discount_percentage.$gte = v;
      }
    }
    if (discount_percentage_max != null && discount_percentage_max !== '') {
      const v = Number(discount_percentage_max);
      if (!Number.isNaN(v)) {
        filter.discount_percentage = filter.discount_percentage || {};
        filter.discount_percentage.$lte = v;
      }
    }

    // Sort
    let sortObj = { is_hot: -1, syncedAt: -1 };
    const sortVal = (sort || '').toString().toLowerCase();
    if (sortVal === 'discount_value') {
      sortObj = { discount_value: -1, is_hot: -1, syncedAt: -1 };
    } else if (sortVal === 'discount_percentage') {
      sortObj = { discount_percentage: -1, is_hot: -1, syncedAt: -1 };
    } else if (sortVal === 'end_date_asc') {
      sortObj = { end_date: 1, is_hot: -1, syncedAt: -1 };
    } else if (sortVal === 'end_date_desc') {
      sortObj = { end_date: -1, is_hot: -1, syncedAt: -1 };
    } else if (sortVal === 'newest') {
      sortObj = { syncedAt: -1, is_hot: -1 };
    } else if (sortVal === 'hot') {
      sortObj = { is_hot: -1, syncedAt: -1 };
    }

    const skip = skipFirst + (parsedPage - 1) * parsedLimit;
    const [items, total] = await Promise.all([
      Coupon.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Coupon.countDocuments(filter)
    ]);

    const data = items.map((doc) => toApiCoupon(doc));

    res.json({
      data,
      meta: {
        total,
        countCurrentDay: isNextDay ? null : total,
        countNextDay: isNextDay ? total : null
      }
    });
  } catch (err) {
    console.error('Error in /api/coupons:', err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Failed to fetch coupons'
    });
  }
});

export default router;
