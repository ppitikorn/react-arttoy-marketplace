// const express = require('express');
// const mongoose = require('mongoose');
// const router = express.Router();
// const { authenticateJWT } = require('../middleware/auth');
// const User = require('../models/User');

// // ให้ตรงกับ enum ในโมเดล
// const CATEGORIES_ENUM = ["Figure","Action Figure","Blind Box","Plush Toys","Art Work","OTHER"];

// router.put('/preferences', authenticateJWT, async (req, res) => {
//   try {
//     const { categories = [], brands = [], tags = [], weights } = req.body;

//     const catArr = Array.isArray(categories)
//       ? categories.map(String).filter(c => CATEGORIES_ENUM.includes(c))
//       : [];

//     const toIds = a => (Array.isArray(a) ? a : [])
//       .map(String)
//       .filter(mongoose.Types.ObjectId.isValid);

//     const patch = {
//       categories: catArr,
//       brands: toIds(brands),
//       tags:   toIds(tags),
//     };
//     if (weights && typeof weights === 'object') patch.weights = weights;

//     const me = await User.findById(req.user._id);
//     if (!me) return res.status(404).json({ ok: false, message: 'User not found' });

//     const saved = await me.updatePreferences(patch);
//     return res.json({ ok: true, preferences: saved.preferences });
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ ok: false, message: 'Failed to update preferences' });
//   }
// });


// module.exports = router;
// routes/user-preferences.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');

// ให้ตรงกับ enum ในโมเดล
const CATEGORIES_ENUM = ["Figure","Action Figure","Blind Box","Plush Toys","Art Work","OTHER"];

router.put('/preferences', authenticateJWT, async (req, res) => {
  try {
    const { categories = [], brands = [], tags = [], weights } = req.body;

    // --- sanitize input ---
    const catArr = (Array.isArray(categories) ? categories : [])
      .map(String)
      .filter(c => CATEGORIES_ENUM.includes(c));

    const toIds = (arr) => (Array.isArray(arr) ? arr : [])
      .map(String)
      .filter(mongoose.Types.ObjectId.isValid);

    // weights เป็น optional; บังคับเป็น number >= 0
    const normWeights = (w = {}) => ({
      categories: Number(w.categories ?? 1) >= 0 ? Number(w.categories ?? 1) : 1,
      brands:     Number(w.brands ?? 1)     >= 0 ? Number(w.brands ?? 1)     : 1,
      tags:       Number(w.tags ?? 1)       >= 0 ? Number(w.tags ?? 1)       : 1,
    });

    const patch = {
      categories: catArr,
      brands: toIds(brands),
      tags: toIds(tags),
      ...(weights && typeof weights === 'object' ? { weights: normWeights(weights) } : {}),
    };

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ ok: false, message: 'User not found' });

    // อัปเดต preferences ผ่าน instance method (จะเซ็ต updatedAt ให้แล้ว)
    const saved = await me.updatePreferences(patch);

    // ถ้าเลือกอย่างน้อย 1 อย่าง ให้ถือว่า onboarded แล้ว
    const picked = (catArr.length + patch.brands.length + patch.tags.length) > 0;
    if (picked && !saved.hasOnboarded) {
      saved.hasOnboarded = true;
      await saved.save();
    }

    // ส่งค่าที่ FE ต้องใช้ (สำคัญ: hasOnboarded)
    return res.json({
      ok: true,
      user: {
        _id: saved._id,
        username: saved.username,
        email: saved.email,
        hasOnboarded: saved.hasOnboarded,
        preferences: saved.preferences,
      },
    });
  } catch (e) {
    console.error('update preferences error:', e);
    return res.status(500).json({ ok: false, message: 'Failed to update preferences' });
  }
});

module.exports = router;

