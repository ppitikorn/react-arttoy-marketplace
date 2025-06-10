const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for anonymous users
  },
  sessionId: {
    type: String,
    required: true // Browser session ID
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  referrer: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient duplicate checking
productViewSchema.index({ product: 1, userId: 1, createdAt: 1 });
productViewSchema.index({ product: 1, sessionId: 1, createdAt: 1 });
productViewSchema.index({ product: 1, ip: 1, createdAt: 1 });

// TTL index to automatically delete old view records (after 30 days)
productViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ProductView = mongoose.model('ProductView', productViewSchema);
module.exports = ProductView;