import express from 'express';
import { Link } from '../models/Link.js';
import { Event } from '../models/Event.js';
import { syncAllCoupons } from '../services/couponSync.js';
import { setupIndex, syncCouponsToMeilisearch } from '../services/meilisearchService.js';

const router = express.Router();

function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  const expected = process.env.ADMIN_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAdmin);

// Nhóm theo subId nếu có, không thì theo ip (để biết "ai" chuyển đổi / click / dùng web)
const linkIdentifierExpr = {
  $cond: {
    if: { $and: [{ $ne: ['$subId', null] }, { $ne: ['$subId', ''] }] },
    then: { $concat: ['sub:', '$subId'] },
    else: { $concat: ['ip:', { $ifNull: ['$ip', 'unknown'] }] }
  }
};

router.get('/stats', async (req, res, next) => {
  try {
    const totalConversions = await Link.countDocuments();

    // Ai chuyển đổi nhiều nhất: group theo subId (nếu có) hoặc ip
    const conversionsByUser = await Link.aggregate([
      { $addFields: { identifier: linkIdentifierExpr } },
      { $group: { _id: '$identifier', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    const totalClicks = await Event.countDocuments({ type: 'click' });

    // Ai click nhiều nhất: Event click có subId từ Link; không có subId thì dùng linkId để lookup ip từ Link
    const clicksByUserFromEvents = await Event.aggregate([
      { $match: { type: 'click' } },
      {
        $lookup: {
          from: 'links',
          localField: 'linkId',
          foreignField: '_id',
          as: 'link',
          pipeline: [{ $project: { subId: 1, ip: 1 } }]
        }
      },
      { $unwind: { path: '$link', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          identifier: {
            $cond: {
              if: { $and: [{ $ne: ['$link.subId', null] }, { $ne: ['$link.subId', ''] }] },
              then: { $concat: ['sub:', '$link.subId'] },
              else: { $concat: ['ip:', { $ifNull: ['$link.ip', 'unknown'] }] }
            }
          }
        }
      },
      { $group: { _id: '$identifier', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    // Ai thời gian dùng web nhiều nhất: Event session group theo subId hoặc "anonymous"
    const topTimeOnSite = await Event.aggregate([
      { $match: { type: 'session', durationSeconds: { $gt: 0 } } },
      {
        $addFields: {
          identifier: {
            $cond: {
              if: { $and: [{ $ne: ['$subId', null] }, { $ne: ['$subId', ''] }] },
              then: { $concat: ['sub:', '$subId'] },
              else: 'ip:anonymous'
            }
          }
        }
      },
      { $group: { _id: '$identifier', totalSeconds: { $sum: '$durationSeconds' }, sessions: { $sum: 1 } } },
      { $sort: { totalSeconds: -1 } },
      { $limit: 30 }
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const conversionsOverTime = await Link.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalConversions,
      totalClicks,
      conversionsByUser: conversionsByUser.map((x) => ({ identifier: x._id, count: x.count })),
      clicksByUser: clicksByUserFromEvents.map((x) => ({ identifier: x._id, count: x.count })),
      topTimeOnSite: topTimeOnSite.map((x) => ({
        identifier: x._id,
        totalSeconds: x.totalSeconds,
        sessions: x.sessions
      })),
      conversionsOverTime: conversionsOverTime.map((x) => ({ date: x._id, count: x.count }))
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/sync-coupons - Chạy đồng bộ coupon ngay (dùng cho lần đầu hoặc chạy thủ công)
// Body/query: { domain, startPage } - startPage: tiếp tục từ trang N khi sync bị gián đoạn
router.post('/sync-coupons', async (req, res, next) => {
  try {
    const domain = req.body?.domain || req.query?.domain || 'shopee.vn';
    const startPage = req.body?.startPage ?? req.query?.startPage;
    const results = await syncAllCoupons({ domain, startPage: startPage ? Number(startPage) : undefined });
    res.json({
      success: true,
      message: 'Đồng bộ coupons hoàn tất',
      results
    });
  } catch (err) {
    console.error('Admin sync-coupons error:', err);
    next(err);
  }
});

// POST /api/admin/sync-meilisearch - Setup index + đồng bộ coupon sang Meilisearch
router.post('/sync-meilisearch', async (req, res, next) => {
  try {
    await setupIndex();
    const result = await syncCouponsToMeilisearch();
    res.json({
      success: true,
      message: 'Meilisearch index setup và sync hoàn tất',
      synced: result.index
    });
  } catch (err) {
    console.error('Admin sync-meilisearch error:', err);
    next(err);
  }
});

export default router;
