// middleware/clientMeta.js
const crypto = require('crypto');

function getClientIp(req) {
  // req.ips จะถูกเติมก็ต่อเมื่อ set('trust proxy', ...) แล้ว
  // ถ้ามีหลายชั้นจะเป็น array ไล่จาก client → proxy
  if (Array.isArray(req.ips) && req.ips.length > 0) {
    return req.ips[0]; // ตัวแรกสุดคือ IP จาก client จริง
  }
  // fallback
  const xff = (req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  if (xff.length) return xff[0];
  return req.ip || req.connection?.remoteAddress || '';
}

// ถ้าอยาก anonymize IPv4 (ตัด /24) และ IPv6 (ตัด /64)
function anonymizeIp(ip) {
  if (!ip) return '';
  // ตัด zone suffix ของ IPv6 เช่น "fe80::1%lo0"
  ip = ip.split('%')[0];
  if (ip.includes('.')) {
    // IPv4: ตัดส่วนท้าย
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  } else if (ip.includes(':')) {
    // IPv6: keep /64
    const blocks = ip.split(':');
    // เติมให้ครบ 8 บล็อกหากยุบ :: (optional จะซับซ้อน)
    // ทางง่าย: แค่คืนต้นๆ ไป 4 บล็อก ที่เหลือเป็น 0
    return blocks.slice(0, 4).join(':') + '::';
  }
  return ip;
}

// ถ้าอยาก hash IP (เพื่อกันระบุตัวตนตรงๆ)
function hashIp(ip, salt) {
  if (!ip) return '';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

function clientMeta(options = {}) {
  const { mode = 'plain', salt = '' } = options; // mode: 'plain' | 'anonymize' | 'hash'
  return function(req, res, next) {
    const realIp = getClientIp(req);
    let storedIp = realIp;

    if (mode === 'anonymize') {
      storedIp = anonymizeIp(realIp);
    } else if (mode === 'hash') {
      storedIp = hashIp(realIp, salt || process.env.IP_HASH_SALT);
    }

    req.clientMeta = {
      ip: storedIp,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || req.headers['referrer'] || '',
    };
    next();
  };
}

module.exports = { clientMeta };
