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

    const catArr = Array.isArray(categories)
      ? categories.map(String).filter(c => CATEGORIES_ENUM.includes(c))
      : [];

    const toIds = a => (Array.isArray(a) ? a : [])
      .map(String)
      .filter(mongoose.Types.ObjectId.isValid);

    const patch = {
      categories: catArr,
      brands: toIds(brands),
      tags:   toIds(tags),
    };
    if (weights && typeof weights === 'object') patch.weights = weights;

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ ok: false, message: 'User not found' });

    const saved = await me.updatePreferences(patch);
    return res.json({ ok: true, preferences: saved.preferences });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: 'Failed to update preferences' });
  }
});


module.exports = router;
