// routes/chat.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { getIO } = require('../socketServer');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// helper: คืนค่า string id ไม่ว่าจะเป็น ObjectId, เอกสารที่มี _id, หรือ string
function idOf(p) {
  if (!p) return null;
  if (typeof p === 'string') return p;
  if (p._id) return String(p._id);
  if (p.toString) return String(p.toString());
  try { return String(p); } catch { return null; }
}

// GET /api/chat/conversations?limit=30&cursor=ISO8601
router.get('/conversations', authenticateJWT, async (req, res) => {
  try {
    const me = req.user._id.toString();
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const cursor = req.query.cursor; // ISO date string (exclusive)

    const cond = { participants: req.user._id };
    if (cursor) {
      const d = new Date(cursor);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: 'Invalid cursor date' });
      }
      cond.lastMessageAt = { $lt: d };
    }

    const convos = await Conversation.find(cond, {
      participants: 1,
      lastMessageAt: 1,
      lastMessageText: 1,
      unread: 1,
    })
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .lean();

    if (!convos.length) {
      return res.json({ items: [], nextCursor: null });
    }

    // ฟิลเตอร์ห้องที่มี participants ครบ 2
    const cleanConvos = convos.filter(c => Array.isArray(c.participants) && c.participants.length >= 2);

    // เอาอีกฝั่งของแชทมา
    const otherIds = cleanConvos
      .map(c => (c.participants || []).map(id => id.toString()).find(pid => pid !== me))
      .filter(Boolean);

    // unique ids
    const uniqueOtherIds = [...new Set(otherIds)];

    // ดึง user ที่ยังมีอยู่จริง
    const users = uniqueOtherIds.length
      ? await User.find(
          { _id: { $in: uniqueOtherIds } },
          { name: 1, username: 1, email: 1, avatar: 1 }
        ).lean()
      : [];
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // map conversations → ตัดออกถ้า peer หาย
    const items = cleanConvos
      .map(c => {
        const other = (c.participants || [])
          .map(id => id.toString())
          .find(pid => pid !== me);

        const found = other ? userMap.get(other) : null;
        if (!found) return null; // 🚨 ตัดออกถ้า peer ถูกลบ

        return {
          conversationId: c._id.toString(),
          peer: {
            _id: other,
            name: found.name || '',
            username: found.username || '',
            email: found.email || '',
            avatar: found.avatar || null,
          },
          lastMessageAt: c.lastMessageAt,
          lastMessageText: c.lastMessageText || '',
          unread: Number(c.unread?.get?.(me) ?? 0),
        };
      })
      .filter(Boolean); // กรอง null ออก

    // cursor pagination
    const last = items[items.length - 1];
    const nextCursor = (items.length === limit) ? last.lastMessageAt : null;

    return res.json({ items, nextCursor });
  } catch (e) {
    console.error('GET /conversations error', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/conversations', authenticateJWT, async (req, res) => {
  const me = req.user._id;
  const { peerId } = req.body;

  if (!peerId || peerId.toString() === me.toString()) {
    return res.status(400).json({ message: 'Invalid peerId' });
  }

  const [a,b] = [me.toString(), peerId.toString()].sort();
  const pairKey = `${a}_${b}`;

  const convo = await Conversation.findOneAndUpdate(
    { pairKey },
    { $setOnInsert: { participants: [a, b], pairKey } },
    { upsert: true, new: true }
  );

  return res.json(convo);
});

router.get('/messages', authenticateJWT, async (req, res) => {
  const { conversationId, before, limit = 20 } = req.query;
  const me = req.user._id;

  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.participants.some(p => p.equals(me)))
    return res.status(403).json({ message:'Forbidden' });

  const q = { conversationId };
  if (before) q.createdAt = { $lt: new Date(before) };

  const msgs = await Message.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
  const items = msgs.reverse();

  // เคลียร์ unread ของเราเมื่อเปิด
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unread.${me.toString()}`]: 0 }
  });

  res.json(items);
});

router.post('/messages', authenticateJWT, async (req, res) => {
  const me = req.user._id;
  const { conversationId, text, images = [] } = req.body;

  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.participants.some(p => p.equals(me))) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const msg = await Message.create({
    conversationId,
    senderId: me,
    text,
    images
  });

  // อัปเดต last + unread ของ “อีกฝั่ง”
  const other = convo.participants.find(p => !p.equals(me)).toString();
  const now = new Date();
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageAt: now,
    lastMessageText: text || (images?.length ? '[image]' : ''),
    $inc: { [`unread.${other}`]: 1 },
  });

  // === ยิง realtime เข้าห้องส่วนตัวของผู้รับ ===
  const io = getIO();            // หรือใช้ req.io ถ้านายแนบมาแล้ว
    if (io && notify) {
      io.to(`user:${other}`).emit('notify', notify);
    }
  io.to(`conv:${conversationId}`).emit('message:new', {
    _id: msg._id,
    conversationId,
    senderId: me,
    text,
    images,
    createdAt: msg.createdAt,
  });
  const notify = await createNotification({
      recipient: other,            // userId อีกฝั่ง (string)
      actor: me,                   // เรา (คนส่ง)
      type: 'message',
      title: 'ข้อความใหม่',
      body: text || (images?.length ? '[image]' : ''),
      refModel: 'Conversation',
      refId: conversationId,
      collapseKey: `msg:${conversationId}`,
    });


  res.json(msg);
});

module.exports = router;