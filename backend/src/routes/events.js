import express from 'express';
import { Event } from '../models/Event.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { type, subId, durationSeconds } = req.body || {};
    if (type !== 'session') {
      return res.status(400).json({ error: 'type must be "session"' });
    }
    if (typeof durationSeconds !== 'number' || durationSeconds < 0) {
      return res.status(400).json({ error: 'durationSeconds must be a non-negative number' });
    }
    await Event.create({
      type: 'session',
      subId: subId && typeof subId === 'string' ? subId : undefined,
      durationSeconds
    });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
