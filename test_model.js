const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },            // ชื่อสินค้า
  description: { type: String, required: true },     // รายละเอียดสินค้า
  images: [{ type: String, required: true }],        // URL รูปสินค้า
  category: {
    type: String,
    enum: ['Blind Box','Vinyl Toy','Resin Toy','Plush Toy','Figure & Statue','Accessory'],
    required: true
  },                                                 
  condition: {
    type: String,
    enum: ['New','Used – Like New','Used – Fair','Rare & Limited'],
    required: true
  },
  brand: { type: String, required: true },           // ชื่อแบรนด์
  collection: { type: String, required: true },      // ชื่อคอลเลคชันหรือซีรีส์
  style: {
    type: String,
    enum: ['Cute & Kawaii','Dark & Gothic','Retro & Vintage','Futuristic','Humorous','Heroes & Villains']
  },                                               
  artist: { type: String },                          // ชื่อศิลปิน (ถ้ามี)
  rarity: {
    type: String,
    enum: ['Mass-Produced','Limited Edition','One-Off']
  },
  price: { type: Number, required: true },           // ราคาขาย
  currency: { type: String, default: 'THB' },        // สกุลเงิน
  quantity: { type: Number, default: 1 },            // จำนวนสินค้า
  tags: [{ type: String }],                          // คีย์เวิร์ดเสริม
  dimensions: {                                      // ขนาดสินค้า (ถ้ามี)
    width: Number,
    height: Number,
    depth: Number
  },
  weight: Number,                                    // น้ำหนัก (g หรือ kg)
  shipping: {                                        // ข้อมูลการจัดส่ง
    origin: String,
    fee: Number,
    method: String
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {                                         
    type: String,
    enum: ['Draft','Published','Sold','Removed'],
    default: 'Draft'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);