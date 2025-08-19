// models/Brand.js
const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
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
      ref: "Brand", // เชื่อมโยงกับโมเดล Brand
      default: null, // หมายถึงไม่มีหมวดหมู่หลัก
    },
  },
  {
    timestamps: true,
  }
);


const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;
