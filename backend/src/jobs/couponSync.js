import cron from 'node-cron';
import { syncAllCoupons } from '../services/couponSync.js';
import { syncCouponsToMeilisearch } from '../services/meilisearchService.js';

export function startCouponSyncCron() {
  cron.schedule('0 */12 * * *', async () => {
    console.log('[CRON] Bắt đầu đồng bộ coupons từ ACCESSTRADE...');
    try {
      const results = await syncAllCoupons({ domain: 'shopee.vn' });
      for (const r of results) {
        console.log(
          `[CRON] Coupon sync (${r.domain}, nextDay=${r.isNextDayCoupon}): fetched=${r.totalFetched}, inserted=${r.totalInserted}, updated=${r.totalUpdated}`
        );
      }
      console.log('[CRON] Hoàn thành đồng bộ coupons.');

      try {
        const meili = await syncCouponsToMeilisearch();
        console.log(`[CRON] Meilisearch sync: ${meili.index} documents`);
      } catch (meiliErr) {
        console.error('[CRON] Meilisearch sync failed:', meiliErr.message);
      }
    } catch (err) {
      console.error('[CRON] Lỗi đồng bộ coupons:', err);
    }
  });
  console.log('[CRON] Lịch đồng bộ coupons: mỗi 12 tiếng (0:00, 12:00)');
}
