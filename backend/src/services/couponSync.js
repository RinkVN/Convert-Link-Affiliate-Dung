import { getCoupons } from './accesstradeClient.js';
import { Coupon } from '../models/Coupon.js';

const SYNC_PAGE_SIZE = 50; // ACCESSTRADE API limit: max 50

/**
 * Chuyển item từ ACCESSTRADE sang object lưu DB
 */
function toCouponDoc(item, domain, isNextDayCoupon) {
  const id = item.id || item._id || String(item);
  return {
    accesstradeId: String(id),
    domain,
    isNextDayCoupon: !!isNextDayCoupon,
    name: item.name,
    merchant: item.merchant,
    image: item.image,
    link: item.link,
    prod_link: item.prod_link,
    content: item.content,
    coupons: item.coupons,
    discount_value: item.discount_value,
    discount_percentage: item.discount_percentage,
    end_date: item.end_date,
    start_date: item.start_date,
    categories: item.categories,
    is_hot: item.is_hot,
    percentage_used: item.percentage_used,
    ctime: item.ctime,
    campaign: item.campaign,
    campaign_id: item.campaign_id,
    campaign_name: item.campaign_name,
    time_left: item.time_left,
    min_spend: item.min_spend,
    max_value: item.max_value,
    coin_cap: item.coin_cap,
    coin_percentage: item.coin_percentage,
    register: item.register,
    shop_id: item.shop_id,
    status: item.status,
    banners: item.banners,
    syncedAt: new Date()
  };
}

/**
 * Đồng bộ toàn bộ coupons từ ACCESSTRADE vào DB cho (domain, isNextDayCoupon).
 * - Insert coupon mới
 * - Update coupon đã tồn tại (nếu có thay đổi)
 * - startPage: tiếp tục từ trang này (dùng khi sync bị gián đoạn)
 */
export async function syncCouponsForDomain({ domain = 'shopee.vn', isNextDayCoupon = false, startPage = 1 } = {}) {
  let page = Math.max(1, Number(startPage) || 1);
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFetched = 0;

  const MAX_RETRIES = 3;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let result;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await getCoupons({
          domain,
          isNextDayCoupon,
          limit: SYNC_PAGE_SIZE,
          page
        });
        break;
      } catch (err) {
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timed out');
        if (isTimeout && attempt < MAX_RETRIES) {
          console.log(`[COUPON] Retry page ${page} (attempt ${attempt}/${MAX_RETRIES})...`);
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        } else {
          throw err;
        }
      }
    }

    const items = result?.items || [];
    if (items.length === 0) break;

    totalFetched += items.length;

    const bulkOps = items.map((item) => {
      const id = item.id || item._id;
      if (!id) return null;

      const doc = toCouponDoc(item, domain, isNextDayCoupon);

      return {
        updateOne: {
          filter: {
            domain,
            isNextDayCoupon: !!isNextDayCoupon,
            accesstradeId: String(id)
          },
          update: { $set: doc },
          upsert: true
        }
      };
    }).filter(Boolean);

    if (bulkOps.length > 0) {
      const bulkResult = await Coupon.bulkWrite(bulkOps);
      totalInserted += bulkResult.upsertedCount || 0;
      totalUpdated += bulkResult.modifiedCount || 0;
    }

    if (items.length < SYNC_PAGE_SIZE) break;
    page += 1;

    // Tránh rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  return {
    domain,
    isNextDayCoupon,
    totalFetched,
    totalInserted,
    totalUpdated,
    totalPages: page
  };
}

/**
 * Đồng bộ tất cả: coupon đang diễn ra + coupon sắp tới
 * - startPage: nếu có, chỉ sync coupon đang diễn ra từ trang đó (để tiếp tục khi bị gián đoạn)
 */
export async function syncAllCoupons(options = {}) {
  const domain = options.domain || 'shopee.vn';
  const startPage = options.startPage;
  const results = [];

  const current = await syncCouponsForDomain({ domain, isNextDayCoupon: false, startPage });
  results.push(current);

  // Chỉ sync next_day khi không có startPage (sync full)
  if (!startPage) {
    const nextDay = await syncCouponsForDomain({ domain, isNextDayCoupon: true });
    results.push(nextDay);
  }

  return results;
}
