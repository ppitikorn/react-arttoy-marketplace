//Tag api
const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().select('-createdAt -updatedAt').sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tags', error: error.message });
  }
});


module.exports = router;
