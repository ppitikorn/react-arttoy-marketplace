const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
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
    const product = await Product.findOne({ slug }).populate('seller', 'avatar username name emailVerified').populate('tags', 'name'); // Populate seller and tags info
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Toggle like/unlike product
router.post('/:slug/like', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;
    console.log('User ID:', userId);

    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already liked the product
    const isLiked = product.likes.includes(userId);

    if (isLiked) {
      // Unlike: Remove user from product's likes array
      product.likes = product.likes.filter(id => id.toString() !== userId.toString());
      
      // Also remove product from user's liked products (if you implement User model update)
      await User.findByIdAndUpdate(userId, {
        $pull: { likedProducts: product._id }
      });
    } else {
      // Like: Add user to product's likes array
      product.likes.push(userId);
      
      // Also add product to user's liked products (if you implement User model update)
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedProducts: product._id }
      });
    }

    await product.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: product.likes.length,
      message: isLiked ? 'Product unliked' : 'Product liked'
    });
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get like status for a product (optional - for checking current state)
router.get('/:slug/like-status', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;

    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isLiked = product.likes.includes(userId);

    res.json({
      isLiked,
      likesCount: product.likes.length
    });
  } catch (error) {
    console.error('Get like status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;