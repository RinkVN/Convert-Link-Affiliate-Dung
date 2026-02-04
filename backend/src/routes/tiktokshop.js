import express from 'express';
import { Link } from '../models/Link.js';
import { createTiktokshopLink } from '../services/accesstradeClient.js';
import { normalizeUrl, getClientIp } from '../utils/urlUtils.js';

const router = express.Router();

function isTiktokshopUrl(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    return (
      host === 'vt.tiktok.com' ||
      host === 'www.tiktok.com' ||
      host === 'tiktok.com' ||
      host === 'shop.tiktok.com' ||
      host.endsWith('.tiktok.com')
    );
  } catch {
    return false;
  }
}

router.post('/create-link', async (req, res) => {
  try {
    const {
      product_url,
      product_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      sub1,
      sub2,
      sub3,
      sub4,
      sub_1,
      sub_2,
      sub_3,
      sub_4
    } = req.body || {};

    if (!product_url || typeof product_url !== 'string') {
      return res.status(400).json({ error: 'product_url is required and must be a string' });
    }

    if (!isTiktokshopUrl(product_url)) {
      return res.status(400).json({
        error: 'URL must be a valid TikTok / TikTok Shop link'
      });
    }

    const apiPayload = {
      product_url,
      product_id,
      // UTM cố định cho TikTok Shop; có thể chỉnh bằng ENV sau này nếu cần
      utm_source: utm_source || 'shopbnh',
      utm_medium: utm_medium || 'tiktok',
      utm_campaign: utm_campaign,
      utm_content: utm_content,
      sub1,
      sub2,
      sub3,
      sub4,
      sub_1,
      sub_2,
      sub_3,
      sub_4
    };

    const result = await createTiktokshopLink(apiPayload);

    // Lưu vào DB để có thể đếm click thông qua /r/:id (giống Shopee)
    const normalizedUrl = normalizeUrl(product_url);
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const linkDoc = await Link.create({
      originalUrl: product_url,
      normalizedUrl,
      affiliateUrl: result.affiliateUrl,
      subId: sub1 || sub_1 || undefined,
      ip,
      userAgent
    });

    // TikTok Shop: ACCESSTRADE đã có tracking rồi, không cần tracking URL riêng
    // Dùng affiliateUrl trực tiếp để tránh redirect không cần thiết
    const clickTrackingUrl = undefined;

    // Chuẩn hóa productInfo cho frontend (giống Shopee):
    // { productName, price, discount, image, commissionRate, estimatedCommission }
    let uiProductInfo = undefined;
    const p = result.productInfo;
    const commission = result.productCommission;

    if (p) {
      let priceNumber = undefined;
      // Xử lý price: có thể là number hoặc object {minimum_amount, maximum_amount}
      if (typeof p.price === 'number') {
        priceNumber = p.price;
      } else if (p.price && typeof p.price.amount === 'string') {
        // loại bỏ ký tự không phải số, ví dụ "20.000" -> 20000
        const numeric = p.price.amount.replace(/[^\d]/g, '');
        if (numeric) {
          priceNumber = Number(numeric);
        }
      } else if (p.price && p.price.minimum_amount) {
        // Nếu có minimum_amount, dùng giá thấp nhất
        const numeric = String(p.price.minimum_amount).replace(/[^\d]/g, '');
        if (numeric) {
          priceNumber = Number(numeric);
        }
      }

      // Tính commissionRate và estimatedCommission từ productCommission
      let commissionRate = undefined;
      let estimatedCommission = undefined;

      if (commission) {
        // Xử lý commission amount
        let commissionAmount = undefined;
        if (typeof commission.amount === 'string') {
          const numeric = commission.amount.replace(/[^\d]/g, '');
          if (numeric) {
            commissionAmount = Number(numeric);
          }
        } else if (typeof commission.amount === 'number') {
          commissionAmount = commission.amount;
        }

        // Xử lý rate: rate có thể là basis points (1000 = 10%) hoặc % trực tiếp
        if (commission.rate != null) {
          // Nếu rate >= 100, coi là basis points (1000 = 10%)
          // Nếu rate < 100, coi là % trực tiếp (10 = 10%)
          if (commission.rate >= 100) {
            commissionRate = commission.rate / 100; // 1000 -> 10%
          } else {
            commissionRate = commission.rate; // 10 -> 10%
          }
        } else if (commissionAmount != null && priceNumber != null && priceNumber > 0) {
          // Tính từ amount và price nếu không có rate
          commissionRate = (commissionAmount / priceNumber) * 100;
        }

        // estimatedCommission = commissionAmount nếu có
        if (commissionAmount != null) {
          estimatedCommission = commissionAmount;
        } else if (commissionRate != null && priceNumber != null) {
          // Tính từ rate nếu không có amount
          estimatedCommission = Math.round((priceNumber * commissionRate) / 100);
        }
      }

      uiProductInfo = {
        productName: p.name || undefined,
        price: priceNumber,
        discount: undefined, // TikTokShop API không trả discount %
        image: p.image || undefined,
        commissionRate: commissionRate,
        estimatedCommission: estimatedCommission
      };
    }

    return res.json({
      id: linkDoc._id.toString(),
      affiliateUrl: result.affiliateUrl,
      shortLink: result.shortLink,
      // Không trả clickTrackingUrl cho TikTok Shop, dùng affiliateUrl trực tiếp
      clickTrackingUrl: undefined,
      productCommission: result.productCommission || undefined,
      productInfo: uiProductInfo,
      rawResponse: result.rawResponse
    });
  } catch (err) {
    console.error('Error in /api/tiktokshop/create-link:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Internal server error while creating TikTokShop affiliate link',
      rawResponse: err.rawResponse
    });
  }
});

export default router;

