// models/Notification.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true }, // คนที่จะได้รับแจ้งเตือน
    actor: { type: Schema.Types.ObjectId, ref: 'User' }, // คนที่กดไลค์/ส่งข้อความ ฯลฯ
    type: { type: String, enum: ['message', 'like', 'comment', 'system'], required: true },
    title: { type: String, trim: true },
    body: { type: String, trim: true },

    // อ้างอิงสิ่งที่เกิดเหตุ เช่น product, conversation, message
    refModel: { type: String, enum: ['Product', 'Conversation', 'Message', 'None'], default: 'None' },
    refId: { type: Schema.Types.ObjectId },
    refSlug: { type: String },
    // ใช้รวม/กันสแปม (เช่น ไลค์ซ้ำๆ บนโพสต์เดียวกัน)
    collapseKey: { type: String, index: true }, // ex: `like:${productId}`

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// index แนะนำ: รีดรายการเร็วๆ
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });



const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
