// routes/upload.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// ป้องกัน: ให้เฉพาะผู้ล็อกอินใช้
const { authenticateJWT } = require('../middleware/auth');

// เลือกโฟลเดอร์สำหรับแชท
const CHAT_FOLDER = process.env.CLOUDINARY_CHAT_FOLDER || 'arttoy/chat';

router.post('/chat/signature', authenticateJWT, async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    // ตัวอย่าง: จำกัดโฟลเดอร์ และ resource_type เป็น image
    const paramsToSign = {
      timestamp,
      folder: CHAT_FOLDER,
      // optional: eager transforms, etc.
    };

    // สร้าง signature แบบ Cloudinary
    const toSign = Object.keys(paramsToSign)
      .sort()
      .map(k => `${k}=${paramsToSign[k]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(toSign + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');

    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder: CHAT_FOLDER,
      signature,
    });
  } catch (e) {
    console.error('sign error', e);
    res.status(500).json({ message: 'sign failed' });
  }
});

module.exports = router;
