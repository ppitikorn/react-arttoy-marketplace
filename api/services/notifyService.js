// services/notifyService.js
const Notification = require('../models/Notification');

async function createNotification({
  recipient,        // userId (string/ObjectId)
  actor,            // admin userId (string/ObjectId) หรือ null
  type,             // 'product_status'
  title,            // 'สินค้าได้รับการเผยแพร่แล้ว', ...
  body,             // เนื้อหาแจ้งเตือน
  refModel,         // 'Product'
  refId,            // productId
  refSlug,          // product slug
  collapseKey,      // ใช้ dedupe ได้
}) {
  if (!recipient || !type) return null;

  if (collapseKey) {
    const doc = await Notification.findOneAndUpdate(
      { recipient, collapseKey },
      {
        $setOnInsert: {
          recipient,
          collapseKey,          // ✅ ต้องบันทึกลงเอกสาร
          createdAt: new Date(), // กันบางเคสไม่มี timestamps จาก upsert
        },
        $set: {
          actor, type, title, body, refModel, refId, refSlug,
          isRead: false,        // ทำให้ไม่อ่านทุกครั้งที่มีอีเวนต์ใหม่มา
          readAt: null,
        },
        $currentDate: { updatedAt: true }, // เด้งเวลาเสมอ
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return doc;
  }

  const created = await Notification.create({
    recipient, actor, type, title, body, refModel, refId, refSlug
  });
  return created.toObject();
}

module.exports = { createNotification };


