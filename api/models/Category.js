// models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // เชื่อมโยงกับโมเดล Category
      default: null, // หมายถึงไม่มีหมวดหมู่หลัก
    },
  },
  {
    timestamps: true,
  }
);


const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
