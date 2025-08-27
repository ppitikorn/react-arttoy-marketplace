// services/recoService.js
// สูตรง่าย: prior(จาก preferences) + behavior(จากสถิติไลก์ล่าสุด) + popularity(ความนิยมรวม)
const Product = require('../models/Product');
const mongoose = require('mongoose');

function priorScore(product, prefs) {
  if (!prefs) return 0;
  const w = prefs.weights || { categories:1, brands:1, tags:1 };
  const catHit   = prefs.categories?.includes(product.category) ? w.categories : 0;
  const brandHit = String(product.brand) && prefs.brands?.map(String).includes(String(product.brand)) ? w.brands : 0;
  const tagHit   = (product.tags || []).some(t => prefs.tags?.map(String).includes(String(t))) ? w.tags : 0;
  const denom = (w.categories + w.brands + w.tags) || 1;
  return Math.min(1, (catHit + brandHit + tagHit) / denom);
}

function behaviorScore(product, behavior = {}) {
  // ตัวอย่างง่าย: ถ้าผู้ใช้เคยไลก์ category/brand นี้เมื่อเร็ว ๆ นี้ให้ + คะแนน
  // behavior = { likedCat: Set([...]), likedBrand: Set([...]), likedTag: Set([...]) }
  let s = 0;
  if (behavior.likedCat?.has(product.category)) s += 0.6;
  if (behavior.likedBrand?.has(String(product.brand))) s += 0.8;
  if ((product.tags||[]).some(t => behavior.likedTag?.has(String(t)))) s += 0.4;
  return Math.min(1, s); // cap
}

function popularityScore(doc) {
  // doc.likesCount, doc.views (เตรียมใน aggregation)
  const likes = doc.likesCount || 0;
  const views = doc.views || 0;
  const ratio = views ? (likes / views) : 0;         // conversion-ish
  const logViews = Math.log10(views + 1) / 3;        // scale 0..~1
  return Math.max(0, Math.min(1, 0.7*ratio + 0.3*logViews));
}

async function getRecommendations({ user, limit = 20, excludeProductId = null }) {
  // 1) เตรียมพฤติกรรมล่าสุดแบบง่าย (ไลก์ใน 30 วัน)
  const cutoff = new Date(Date.now() - 30*24*60*60*1000);
  // ดึงเฉพาะ product ที่ Published
  const match = { status: 'Published', isSold: false };
  if (excludeProductId) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludeProductId) };
  }

  // 2) โหลด candidate จาก DB (เบื้องต้น 200 ชิ้น)
  //    พร้อมนับ likesCount (ความนิยมหยาบ) เพื่อคำนวณ popularityScore
  const docs = await Product.aggregate([
    { $match: match },
    { $project: {
        title:1, slug:1, price:1, images: { $slice: ['$images',1] },rarity:1, condition:1,seller:1,
        category:1, brand:1, tags:1, views:1, likes:1, createdAt:1
      }},
    { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
    { $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'seller',
        pipeline: [
          { $project: { _id: 1, username: 1, name: 1, avatar: 1, emailVerified: 1 } }
        ]
    }},
    { $match: { seller: { $ne: [] } } },
    { $unwind: '$seller' },
    { $sort: { createdAt: -1 } }, // เอนเอียงไปของใหม่เล็กน้อย
    { $limit: 200 },
  ]);

  // 3) เตรียม behavior ของ user แบบหยาบ ๆ (จาก likedProducts)
  const likedProducts = (user.likedProducts || []).map(String);
  const likedDocs = docs.filter(d => likedProducts.includes(String(d._id)));
  const likedCat   = new Set(likedDocs.map(d => d.category));
  const likedBrand = new Set(likedDocs.map(d => String(d.brand)));
  const likedTag   = new Set(likedDocs.flatMap(d => (d.tags || []).map(String)));

  const behavior = { likedCat, likedBrand, likedTag };
  const prefs = user.preferences || null;

  // 4) คำนวณคะแนนรวม
  const results = docs.map(d => {
    const ps = priorScore(d, prefs);
    const bs = behaviorScore(d, behavior);
    const pop = popularityScore(d);

    // น้ำหนักรวม (ปรับได้ง่าย)
    const W = { prior: 0.5, behavior: 0.3, popularity: 0.2 };
    const score = W.prior*ps + W.behavior*bs + W.popularity*pop;

    return { product: d, score, parts: { prior: ps, behavior: bs, popularity: pop } };
  });

  // 5) จัดอันดับ + ตัดจำนวน
  results.sort((a,b) => b.score - a.score);
  return results.slice(0, limit);
}

module.exports = { getRecommendations };
