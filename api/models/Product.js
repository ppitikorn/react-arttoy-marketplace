// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // เชื่อมโยงกับโมเดล Category
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String], // เก็บ URL รูปภาพ (หลายรูป)
      required: true,
    },
    condition: {
      type: String,
      enum: ["มือ 1", "มือ 2"],
      default: "มือ 2",
    },
    tags: {
      type: [String], // เช่น ["rare", "limited edition"]
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
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ]
  },
  {
    timestamps: true, // เพิ่ม createdAt / updatedAt ให้อัตโนมัติ
  }
);


const Product = mongoose.model('Product', productSchema);
module.exports = Product;