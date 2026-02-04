import express from 'express';
import axios from 'axios';
import { Link } from '../models/Link.js';
import {
  isShopeeUrl,
  normalizeUrl,
  getClientIp,
  parseShopeeProductFromUrl
} from '../utils/urlUtils.js';
import { createTrackingLink, getCommissionRatio } from '../services/accesstradeClient.js';
import { getProductFromDatafeed } from '../services/shopeeDatafeed.js';

const router = express.Router();

async function resolveShortLinkIfNeeded(originalUrl) {
  try {
    const url = new URL(originalUrl);
    const hostname = url.hostname;
    const shortDomains = ['vn.shp.ee', 's.shopee.vn'];

    if (!shortDomains.includes(hostname)) {
      return originalUrl;
    }

    // Try to resolve redirect without following automatically
    const resp = await axios.get(originalUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const redirectLocation = resp.headers.location;
    if (redirectLocation) {
      return redirectLocation;
    }

    return originalUrl;
  } catch (err) {
    console.warn('Failed to resolve short link, using original URL', err.message);
    return originalUrl;
  }
}

/** Logic convert dùng chung cho POST /api/convert và GET /render-link */
async function performConvert(originalUrl, subId, req) {
  const resolvedUrl = await resolveShortLinkIfNeeded(originalUrl);
  const normalizedUrl = normalizeUrl(resolvedUrl);

  const { affiliateUrl } = await createTrackingLink({
    originalUrl,
    normalizedUrl,
    subId
  });

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  const linkDoc = await Link.create({
    originalUrl,
    normalizedUrl,
    affiliateUrl,
    subId,
    ip,
    userAgent
  });

  const apiBase = process.env.API_BASE_URL || '';
  const clickTrackingUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/r/${linkDoc._id}` : undefined;

  let productInfo = null;
  const campaignId = process.env.ACCESSTRADE_SHOPEE_CAMPAIGN_ID?.trim();
  const defaultCommissionEnv = process.env.SHOPEE_DEFAULT_COMMISSION_RATE;
  const defaultCommissionRate =
    defaultCommissionEnv != null && defaultCommissionEnv !== ''
      ? parseFloat(defaultCommissionEnv)
      : null;

  const parsed = parseShopeeProductFromUrl(normalizedUrl);
  const productDetail = parsed
    ? getProductFromDatafeed(parsed.shopId, parsed.itemId)
    : null;
  const commissionRateFromApi = campaignId ? await getCommissionRatio(campaignId) : null;

  const commissionRate =
    typeof commissionRateFromApi === 'number' && commissionRateFromApi >= 0
      ? commissionRateFromApi
      : defaultCommissionRate;

  // Giá dùng để tính hoa hồng:
  // - Nếu CSV trả discount trong khoảng (0,100) coi là % giảm giá -> giá sau giảm = price * (1 - discount/100)
  // - Ngược lại (discount rỗng / không hợp lệ) dùng price làm giá đơn hàng
  let salePrice = null;
  if (productDetail && typeof productDetail.price === 'number') {
    const price = productDetail.price;
    const d = productDetail.discount;
    if (typeof d === 'number' && d > 0 && d < 100) {
      salePrice = Math.round(price * (1 - d / 100));
    } else {
      salePrice = price;
    }
  }

  // Thông tin cơ bản từ CSV (hiển thị lên UI kể cả khi chưa tính được hoa hồng)
  if (productDetail) {
    productInfo = {
      productName: productDetail.name,
      price: productDetail.price,
      discount: productDetail.discount,
      image: productDetail.image
    };
  }

  // Bổ sung thông tin hoa hồng nếu tính được
  if (salePrice != null && typeof commissionRate === 'number' && commissionRate >= 0) {
    const estimatedCommission = Math.round((salePrice * commissionRate) / 100);
    productInfo = {
      ...(productInfo || {}),
      commissionRate,
      estimatedCommission
    };
  } else if (typeof commissionRate === 'number' && commissionRate >= 0) {
    productInfo = {
      ...(productInfo || {}),
      commissionRate
    };
  }

  return {
    id: linkDoc._id.toString(),
    affiliateUrl,
    clickTrackingUrl: clickTrackingUrl || linkDoc.affiliateUrl,
    productInfo: productInfo || undefined
  };
}

router.post('/', async (req, res, next) => {
  try {
    const { originalUrl, subId } = req.body || {};

    if (!originalUrl || typeof originalUrl !== 'string') {
      return res.status(400).json({ error: 'originalUrl is required and must be a string' });
    }

    if (subId && typeof subId !== 'string') {
      return res.status(400).json({ error: 'subId must be a string if provided' });
    }

    if (!isShopeeUrl(originalUrl)) {
      return res.status(400).json({
        error: 'URL must be a valid Shopee link (shopee.vn, vn.shp.ee, s.shopee.vn)'
      });
    }

    const result = await performConvert(originalUrl, subId, req);
    return res.json(result);
  } catch (err) {
    console.error('Error in /api/convert:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Internal server error while converting link'
    });
  }
});

/** GET /render-link?url=...&subId=... — handler dùng cho route ở root (giống trang khác) */
export async function renderLinkHandler(req, res) {
  try {
    const originalUrl = req.query.url;
    const subId = req.query.subId;

    if (!originalUrl || typeof originalUrl !== 'string') {
      return res.status(400).json({ error: 'url is required (query param)' });
    }

    if (subId != null && typeof subId !== 'string') {
      return res.status(400).json({ error: 'subId must be a string if provided' });
    }

    if (!isShopeeUrl(originalUrl)) {
      return res.status(400).json({
        error: 'URL must be a valid Shopee link (shopee.vn, vn.shp.ee, s.shopee.vn)'
      });
    }

    const result = await performConvert(originalUrl, subId || undefined, req);
    return res.json(result);
  } catch (err) {
    console.error('Error in /render-link:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Internal server error while converting link'
    });
  }
}

router.get('/render-link', renderLinkHandler);

// Optional: recent links for frontend history display
router.get('/recent', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const links = await Link.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    res.json({
      data: links.map((l) => ({
        id: l._id.toString(),
        originalUrl: l.originalUrl,
        affiliateUrl: l.affiliateUrl,
        subId: l.subId,
        createdAt: l.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

export default router;

