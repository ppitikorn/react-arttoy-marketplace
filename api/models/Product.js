// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand", 
      required: true,
    },
    category: {
      type: String,
      enum: ["Figure", "Action Figure", "Blind Box", "Plush Toys", "Art Work", "OTHER"],
      required: true,
    },
    rarity: {
      type: String,
      enum: ["Common", "Secret", "Limited"],
      default: "Common",
      required: true,
    },
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag" 
    }],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String], 
      validate: v=> Array.isArray(v) && v.length > 0, // ต้องมีอย่างน้อย 1 รูป
      required: true,
    },
    condition: {
      type: String,
      enum: ["Pre-owned", "Brand New"],
      default: "Pre-owned",
    },
    isSold: {
      type: Boolean,
      default: false,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ['Published', 'Pending', 'Reported', 'Hidden'],
      default: 'Pending',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, 
  }
);


const Product = mongoose.model('Product', productSchema);
module.exports = Product;