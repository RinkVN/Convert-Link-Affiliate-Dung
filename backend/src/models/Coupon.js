import mongoose from 'mongoose';

/**
 * Schema lưu coupon đồng bộ từ ACCESSTRADE.
 * Unique: (domain, isNextDayCoupon, accesstradeId)
 */
const CouponSchema = new mongoose.Schema(
  {
    accesstradeId: { type: String, required: true },
    domain: { type: String, required: true, default: 'shopee.vn' },
    isNextDayCoupon: { type: Boolean, required: true, default: false },

    // Raw fields từ ACCESSTRADE API
    name: { type: String },
    merchant: { type: String },
    image: { type: String },
    link: { type: String },
    prod_link: { type: String },
    content: { type: String },
    coupons: { type: mongoose.Schema.Types.Mixed }, // [{ coupon_code, coupon_desc, ... }]
    discount_value: { type: Number },
    discount_percentage: { type: Number },
    end_date: { type: String },
    start_date: { type: String },
    categories: { type: mongoose.Schema.Types.Mixed },
    is_hot: { type: String },
    percentage_used: { type: Number },
    ctime: { type: mongoose.Schema.Types.Mixed },
    campaign: { type: String },
    campaign_id: { type: String },
    campaign_name: { type: String },
    time_left: { type: String },
    min_spend: { type: Number },
    max_value: { type: Number },
    coin_cap: { type: Number },
    coin_percentage: { type: Number },
    register: { type: Number },
    shop_id: { type: mongoose.Schema.Types.Mixed },
    status: { type: Number },
    banners: { type: mongoose.Schema.Types.Mixed },

    syncedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    collection: 'coupons'
  }
);

CouponSchema.index({ domain: 1, isNextDayCoupon: 1, accesstradeId: 1 }, { unique: true });
CouponSchema.index({ domain: 1, isNextDayCoupon: 1 });
CouponSchema.index({ syncedAt: -1 });

export const Coupon = mongoose.model('Coupon', CouponSchema);
