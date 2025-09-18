// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const {authenticateJWT} = require('../middleware/auth'); // ตรงกับโปรเจคของนาย

// routes/notifications.js
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const q = { recipient: req.user._id };
    if (unread === 'true') q.isRead = false;

    // populate actor แบบ lean()
    const items = await Notification.find(q)
      .sort({ updatedAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate('actor', 'username avatar') // actor อาจจะ null ถ้าโดนลบ
      .lean();

    // กรองแจ้งเตือนที่ actor หายไป
    const filtered = items.filter(n => n.actor);

    res.json({ items: filtered });
  } catch (err) {
    console.error('GET /notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/count', authenticateJWT, async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ count });
});

router.patch('/mark-all/read', authenticateJWT, async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json({ ok: true });
});

router.patch('/:id/read', authenticateJWT, async (req, res) => {
  const doc = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  res.json(doc);
});

module.exports = router;
