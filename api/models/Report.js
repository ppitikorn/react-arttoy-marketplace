// pshop/api/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: [
      "Inappropriate Content",
      "Scam or Fraud",
      "Spam",
      "Wrong Category",
      "Other"
    ],
    required: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500 // รายละเอียดเพิ่มเติมจาก user
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved', 'Dismissed'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // ผู้ดูแลระบบ (admin/mod)
    default: null
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
