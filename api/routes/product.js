const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Product = require('../models/Product');
const { uploadProduct } = require('../middleware/uploadMiddleware'); // Import the upload middleware
const { cloudinary } = require('../config/cloudinaryConfig');

// Create a new product
// NEED TO ORGANIZE THIS ROUTE
router.post('/', authenticateJWT, uploadProduct.array('images', 5), async (req, res) => {
  try {
    const { title, price, category, brand, details, condition, rarity, tags } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!title || !price || !category || !brand || !details || !condition || !rarity || !tags) {
      return res.status(400).json({ message: 'All fields are required' });
    }
 
    // Upload images to Cloudinary Cloudinary URL from the uploaded file
    // const imageUrls = [];
    // for (const file of req.files) {
    //   const result = await cloudinary.uploader.upload(file.path, { folder: 'products' });
    //   imageUrls.push(result.secure_url);
    // }
    const imageUrls = req.files.map(file => file.path); // หรือ file.url ขึ้นกับว่าคุณใช้ field ไหนจาก multer-cloudinary
    if (imageUrls.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }


    // Create a new product
    const newProduct = new Product({
      title,
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
    const { category, brand, tags } = req.query;

    // Build the filter object
    const filter = {};
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (tags) filter.tags = { $in: tags.split(',') };

    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

//Get all products for admin
router.get('/admin', /*authenticateJWT,*/ async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'username email'); // Populate seller info
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products for admin:', error);
    res.status(500).json({ message: 'Failed to fetch products for admin' });
  }
});

module.exports = router;