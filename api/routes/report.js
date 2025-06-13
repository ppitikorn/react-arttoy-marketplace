const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Report = require('../models/Report');
const Product = require('../models/Product');

// Create a new report
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { productId, reason, message } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!productId || !reason) {
      return res.status(400).json({ message: 'Product ID and reason are required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has already reported this product
    const existingReport = await Report.findOne({
      product: productId,
      reporter: userId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this product' });
    }

    // Validate reason
    const validReasons = ["Inappropriate Content", "Scam or Fraud", "Spam", "Wrong Category", "Other"];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ message: 'Invalid reason provided' });
    }

    // Create new report
    const newReport = new Report({
      product: productId,
      reporter: userId,
      reason,
      message: message || '',
      status: 'Pending'
    });

    await newReport.save();

    // Populate the report for response
    const populatedReport = await Report.findById(newReport._id)
      .populate('product', 'title images')
      .populate('reporter', 'username');

    res.status(201).json({
      message: 'Report submitted successfully',
      report: populatedReport
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Failed to submit report', error: error.message });
  }
});

// Get user's reports
router.get('/my-reports', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const reports = await Report.find({ reporter: userId })
      .populate('product', 'title images')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
});

module.exports = router;
