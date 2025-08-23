// socketServer.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    maxHttpBufferSize: 3e6, // ~3MB
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // ---------- Auth ----------
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').split(' ')[1]; // Bearer <token>
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload?.id || !isValidObjectId(payload.id)) return next(new Error('unauthorized'));
      socket.user = { id: payload.id.toString() }; // keep as string
      return next();
    } catch (e) {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log('[socket] connected', socket.id, 'userId=', userId);

    socket.join(`user:${userId}`);
    console.log(`[Socket Private] auto-join user:${userId}`);

    const ackWrap = (ack, data) => {
      if (typeof ack === 'function') ack(data);
    };

    // ---- playground echo (optional) ----
    socket.on('chat:message', (data, ack) => {
      const safe = {
        userid: String(data?.userid || userId),
        text: String(data?.text || ''),
        time: data?.time || Date.now(),
      };
      io.emit('chat:message', safe);
      ackWrap(ack, { ok: true });
    });

    // ---- join/leave conversation rooms (with ack & validation) ----
    socket.on('conversation:join', (conversationId, ack) => {
      if (!isValidObjectId(conversationId)) return ackWrap(ack, { ok: false, error: 'Invalid conversationId' });
      socket.join(`conv:${conversationId}`);
      console.log(`[socket] join conv:${conversationId} by ${userId}`);
      ackWrap(ack, { ok: true });
    });
  //   socket.on("conversation:join", async (conversationId, ack) => {
  //   try {
  //     // ตรวจสิทธิ์: ผู้ใช้ต้องเป็น participant
  //     const convo = await Conversation.findById(conversationId).lean();
  //     if (!convo || !convo.participants.some(p => String(p) === String(userId))) {
  //       return ack?.({ ok: false, error: "Forbidden" });
  //     }
  //     socket.join(`conv:${conversationId}`);
  //     console.log(`[server] joined conv:${conversationId} uid:${userId}`);
  //     return ack?.({ ok: true });
  //   } catch (e) {
  //     console.error("join error", e);
  //     return ack?.({ ok: false, error: e.message });
  //   }
  // });

    socket.on('conversation:leave', (conversationId, ack) => {
      if (!isValidObjectId(conversationId)) return ackWrap(ack, { ok: false, error: 'Invalid conversationId' });
      socket.leave(`conv:${conversationId}`);
      ackWrap(ack, { ok: true });
    });

    // ---- send message (idempotent via clientMessageId) ----
    // payload: { conversationId, text, images, clientMessageId }
    socket.on('message:send', async (data, ack) => {
      try {
        const conversationId = String(data?.conversationId || '');
        const text = (data?.text || '').trim();
        const images = Array.isArray(data?.images) ? data.images : [];
        const clientMessageId = data?.clientMessageId ? String(data.clientMessageId) : '';

        if (!isValidObjectId(conversationId)) return ackWrap(ack, { ok: false, error: 'Invalid conversationId' });
        if (!text && images.length === 0)   return ackWrap(ack, { ok: false, error: 'Empty message' });
        if (images.length > 8)              return ackWrap(ack, { ok: false, error: 'Too many images' });

        const convo = await Conversation.findById(conversationId).lean();
        if (!convo || !convo.participants.some(p => p.toString() === userId)) {
          return ackWrap(ack, { ok: false, error: 'Forbidden' });
        }

        // idempotency: if client sends a uuid, avoid duplicates
        if (clientMessageId) {
          const existed = await Message.findOne({ conversationId, clientMessageId }).lean();
          if (existed) {
            io.to(`conv:${conversationId}`).emit('message:new', existed);
            return ackWrap(ack, { ok: true, message: existed, dedup: true });
          }
        }

        const now = new Date();
        const msg = await Message.create({
          conversationId,
          senderId: userId,
          text,
          images,
          clientMessageId: clientMessageId || undefined,
          createdAt: now,
        });

        // update last + unread for other participants
        const inc = {};
        for (const p of convo.participants) {
          const pid = p.toString();
          if (pid !== userId) inc[`unread.${pid}`] = 1;
        }

        await Conversation.updateOne(
          { _id: conversationId },
          {
            $set: {
              lastMessageAt: now,
              lastMessageText: text || (images.length ? '[image]' : ''),
            },
            $inc: inc,
          }
        );

        // broadcast only to this conversation room
        const payload = {
          _id: msg._id,
          conversationId,
          senderId: userId,
          text,
          images,
          createdAt: msg.createdAt,
        };
        io.to(`conv:${conversationId}`).emit('message:new', payload);

        for (const p of convo.participants) {
          const pid = p.toString();
          io.to(`user:${pid}`).emit('conversation:update', {
            conversationId: conversationId,
            lastMessageAt: now,
            lastMessageText: text || (images.length ? '[image]' : ''),
            senderId: userId,
          });
          console.log(`[Socket Private] conversation:update ${pid}`);
        }


        ackWrap(ack, { ok: true, message: payload });
      } catch (e) {
        console.error('message:send error', e);
        ackWrap(ack, { ok: false, error: 'Internal error' });
      }
    });

    // ---- read receipts (heavy version using readBy) ----
    // payload: { conversationId, until }   // until = ISO string
    socket.on('message:read', async (data, ack) => {
      try {
        const conversationId = String(data?.conversationId || '');
        const until = new Date(data?.until || Date.now());
        if (!isValidObjectId(conversationId)) return ackWrap(ack, { ok: false, error: 'Invalid conversationId' });

        const convo = await Conversation.findById(conversationId).lean();
        if (!convo || !convo.participants.some(p => p.toString() === userId)) {
          return ackWrap(ack, { ok: false, error: 'Forbidden' });
        }

        await Message.updateMany(
          { conversationId, createdAt: { $lte: until } },
          { $addToSet: { readBy: userId } }
        );
        await Conversation.updateOne(
          { _id: conversationId },
          { $set: { [`unread.${userId}`]: 0 } }
        );

        io.to(`conv:${conversationId}`).emit('message:read', { userId, until });
        ackWrap(ack, { ok: true });
      } catch (e) {
        console.error('message:read error', e);
        ackWrap(ack, { ok: false, error: 'Internal error' });
      }
    });

    // ---- typing indicator (optional) ----
    // payload: { conversationId, isTyping: boolean }
    socket.on('typing', (data, ack) => {
      const conversationId = String(data?.conversationId || '');
      const isTyping = !!data?.isTyping;
      if (!isValidObjectId(conversationId)) return ackWrap(ack, { ok: false, error: 'Invalid conversationId' });
      socket.to(`conv:${conversationId}`).emit('typing', { userId, isTyping });
      ackWrap(ack, { ok: true });
    });

    // ---- disconnect ----
    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', socket.id, 'reason=', reason);
    });
  });

  return io;
}

module.exports = initializeSocket;
