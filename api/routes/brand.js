const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const Brand = require('../models/Brand');

// Get all brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find().select('-__v -createdAt -updatedAt').sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands', error: error.message });
  }
});
// Get brand parent = null
router.get('/parent-null', async (req, res) => {
  try {
    const brands = await Brand.find({ parent: null }).select('-__v -createdAt -updatedAt').sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands with parent null', error: error.message });
  }
});
// Get brands with populated parent 
router.get('/parent', async (req, res) => {
  try {
    const brands = await Brand.find().populate('parent').select('-__v -createdAt -updatedAt').sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands with parent', error: error.message });
  }
});

module.exports = router;
