// const Notification = require('../models/Notification');

// async function createNotification({
//   recipient, actor, type, title, body,
//   refModel = 'None', refId = null, collapseKey = null,
// }) {
//   if (!recipient || !type) return null;

//   if (collapseKey) {
//     return await Notification.findOneAndUpdate(
//       { recipient, collapseKey },
//       {
//         $setOnInsert: { recipient, actor, type, title, body, refModel, refId },
//         $set: { isRead: false, readAt: null },
//         $currentDate: { updatedAt: true }
//       },
//       { new: true, upsert: true }
//     ).lean();
//   }

//   const doc = await Notification.create({ recipient, actor, type, title, body, refModel, refId });
//   return doc.toObject();
// }

// module.exports = { createNotification };
// services/notifyService.js
const Notification = require('../models/Notification');

async function createNotification({
  recipient, actor, type, title, body,
  refModel = 'None', refId = null, collapseKey = null,
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
          actor, type, title, body, refModel, refId,
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
    recipient, actor, type, title, body, refModel, refId,
  });
  return created.toObject();
}

module.exports = { createNotification };


