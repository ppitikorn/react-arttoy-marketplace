// This file defines the routes for admin functionalities in the application.
// It includes user management, category management, and product management.
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Tag = require('../models/Tag');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Report = require('../models/Report');
const cloudinary = require('cloudinary').v2;

// Get all users (Admin only)
router.get('/users', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Create a new user (Admin only)
router.post('/users', authenticateJWT, isAdmin, async (req, res) => {
  // try {
  //   const newUser = new User(req.body);
  //   await newUser.save();
  //   res.status(201).json(newUser);
  // } catch (error) {
  //   res.status(500).json({ message: 'Error creating user', error: error.message });
  // }
  try {
    const { email, password, username, name ,role} = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      return res.status(400).json({ message: 'Username is already taken' });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      name, // Set initial name same as username
      role // Default role
    });

    await newUser.save();
    res.status(201).json(newUser);

  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Update an existing user (Admin only)
router.put('/users/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete a user (Admin only)
router.delete('/users/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Get all tags (Admin only)
router.get('/tags', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tags', error: error.message });
  }
});

// Create a new tag (Admin only)
router.post('/tags', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const newTag = new Tag({ name, slug });
    await newTag.save();
    res.status(201).json(newTag);
  } catch (error) {
    res.status(500).json({ message: 'Error creating tag', error: error.message });
  }
});

// Update an existing tag (Admin only)
router.put('/tags/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const updatedTag = await Tag.findByIdAndUpdate(req.params.id, { name, slug }, { new: true });
    res.json(updatedTag);
  } catch (error) {
    res.status(500).json({ message: 'Error updating tag', error: error.message });
  }
});
// Delete a tag (Admin only)
router.delete('/tags/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tag', error: error.message });
  }
});
// Create brand (Admin only)
router.post('/brands', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { name , parent } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const brand = await Brand.create({ name, slug, parent });
    res.status(201).json(brand);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Brand already exists' });
    }
    res.status(500).json({ message: 'Error creating brand', error: error.message });
  }
});
// Get all brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands', error: error.message });
  }
});
// Get brand parent = null
router.get('/brands/parent-null', async (req, res) => {
  try {
    const brands = await Brand.find({ parent: null }).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands with parent null', error: error.message });
  }
});
// Get brands with populated parent 
router.get('/brands/parent', async (req, res) => {
  try {
    const brands = await Brand.find().populate('parent').sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands with parent', error: error.message });
  }
});
// Update brand (Admin only)
router.put('/brands/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { name, slug },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json(brand);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Brand already exists' });
    }
    res.status(500).json({ message: 'Error updating brand', error: error.message });
  }
});
// Delete brand (Admin only)
router.delete('/brands/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting brand', error: error.message });
  }
});

// Get all products for admin
router.get('/products', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'username email')
      .populate('tags', 'name')
      .populate({
        path: 'brand',
        select: 'name parent',
        populate: {
          path: 'parent',
          select: 'name',
        },
      })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Delete a product (Admin only)
router.delete('/products/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.images && product.images.length > 0) {
      try {
        // Delete images from Cloudinary
        for (const image of product.images) {
          const publicId = image.split('/').slice(-1)[0].split('.')[0];
          await cloudinary.uploader.destroy(`arttoy/product/${publicId}`);
        }
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
      }
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Update product (Admin only)
router.put('/products/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { title, description, price, category, condition, rarity, images } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { title, description, price, category, condition, rarity, images },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Update product status (Admin Only)
router.patch('/products/:id/status', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['Published', 'Pending', 'Rejected', 'Hidden'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product status', error: error.message });
  }
});

// Get all reports (Admin Only)
router.get('/reports', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('product', 'title images')
      .populate('reporter', 'username email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
});

// Update report status (Admin Only)
router.patch('/reports/:id/status', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['Pending', 'Reviewed', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // If marking as resolved and it's a product report, update the product status
    if (status === 'Resolved') {
      await Product.findByIdAndUpdate(report.product, {
        $set: { status: 'Published' }
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error updating report status', error: error.message });
  }
});

module.exports = router;
