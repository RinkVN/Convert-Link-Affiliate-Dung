import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    normalizedUrl: { type: String, required: true },
    affiliateUrl: { type: String, required: true },
    subId: { type: String },
    ip: { type: String },
    userAgent: { type: String }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

export const Link = mongoose.model('Link', LinkSchema);

