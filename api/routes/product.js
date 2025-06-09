const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Product = require('../models/Product');
const { uploadProduct } = require('../middleware/uploadMiddleware'); // Import the upload middleware
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');


// Create a new product
// NEED TO ORGANIZE THIS ROUTE
function slugifyThai(str) {
  return str.trim()
    .replace(/\s+/g, '-')     // แทนที่ช่องว่างด้วย -
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\-]/g, '') // ลบสัญลักษณ์ที่ไม่ใช่ไทย อังกฤษ หรือเลข
    .toLowerCase();
}
router.post('/', authenticateJWT, uploadProduct.array('images', 5), async (req, res) => {
  try {
    const { title, price, category, brand, details, condition, rarity, tags } = req.body;
    const userId = req.user._id;
    const baseSlug = slugifyThai(title); // Use slugifyThai for Thai titles
    const slug = `${baseSlug}-${uuidv4()}`; // Append a random string to ensure uniqueness


    // Validate required fields
    if (!title || !price || !category || !brand || !details || !condition || !rarity || !tags) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const imageUrls = req.files.map(file => file.path); // หรือ file.url ขึ้นกับว่าคุณใช้ field ไหนจาก multer-cloudinary
    if (imageUrls.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }


    // Create a new product
    const newProduct = new Product({
      title,
      slug,
      price,
      category,
      brand,
      images: imageUrls,
      details,
      condition,
      rarity,
      tags,
      seller: userId,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, brand, tags , rarity} = req.query;

    // Build the filter object
    const filter = {};
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (rarity) filter.rarity = rarity;

    const products = await Product.find(filter).populate('seller', 'avatar username name emailVerified'); // Populate seller info
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get a single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).populate('seller', 'avatar username name emailVerified');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});


module.exports = router;