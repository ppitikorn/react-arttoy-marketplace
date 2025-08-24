// src/utils/uploadChatImage.js
import api from '../utils/api';

export async function uploadChatImage(file) {
  // 0) ตรวจเบื้องต้น
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('รองรับเฉพาะไฟล์รูปภาพ');
  }
  if (file.size > 8 * 1024 * 1024) { // 8MB (ปรับได้)
    throw new Error('ไฟล์ใหญ่เกินกำหนด');
  }

  // 1) ขอ signature
  const signRes = await api.post('/api/upload/chat/signature');
  const { cloudName, apiKey, timestamp, folder, signature } = signRes.data;

  // 2) อัปโหลดขึ้น Cloudinary
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('folder', folder);
  form.append('signature', signature);

  const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const resp = await fetch(cloudUrl, { method: 'POST', body: form });
  if (!resp.ok) throw new Error('อัปโหลดไม่สำเร็จ');
  const data = await resp.json();

  // 3) คืนค่า metadata ที่ Message.images ต้องการ
  return {
    url: data.secure_url,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    publicId: data.public_id,
  };
}
