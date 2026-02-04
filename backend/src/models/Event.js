import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['click', 'session'] },
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link' },
    subId: { type: String },
    durationSeconds: { type: Number }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const Event = mongoose.model('Event', EventSchema);
