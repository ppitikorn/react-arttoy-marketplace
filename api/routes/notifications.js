// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const {authenticateJWT} = require('../middleware/auth'); // ตรงกับโปรเจคของนาย

router.get('/', authenticateJWT, async (req, res) => {
  const { page = 1, limit = 20, unread } = req.query;
  const q = { recipient: req.user._id };
  if (unread === 'true') q.isRead = false;

  const items = await Notification.find(q)
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .populate('actor', 'username avatar')
    .lean();

  res.json({ items });
});

router.get('/count', authenticateJWT, async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ count });
});

router.patch('/:id/read', authenticateJWT, async (req, res) => {
  const doc = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  res.json(doc);
});

router.patch('/mark-all/read', authenticateJWT, async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json({ ok: true });
});

module.exports = router;
