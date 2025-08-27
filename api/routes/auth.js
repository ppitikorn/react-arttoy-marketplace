const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const User = require('../models/User');
const { authenticateGoogle , authenticateJWT } = require('../middleware/auth');
const passport = require('passport');

// Register new user
router.post('/register', async (req, res) => {  try {
    const { email, password, username } = req.body;

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
    const hashedPassword = await bcrypt.hash(password, salt);    // Create new user
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      name: username, // Set initial name same as username
    });

    // Generate JWT token
    const token = generateToken(user);    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;    // Check if user exists and include password field for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct (only for non-OAuth users)
    if (!user.password) {
      return res.status(400).json({ message: 'Please login with Google' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if( user.status.state === 'banned') {
      const reason = user.status.reason || 'No reason provided';
      return res.status(403).json({ message: `Your account is banned: ${reason}` });
    }
    if( user.status.state === 'suspended') {
      const reason = user.status.reason || 'No reason provided';
      const now = new Date();
      const suspendedAt = new Date(user.status.lastUpdated);
      const suspensionDuration = 1 * 24 * 60 * 60 * 1000; // 1 day in milliseconds
      if (now - suspendedAt < suspensionDuration) {
        const timeLeft = Math.ceil((suspendedAt.getTime() + suspensionDuration - now.getTime()) / (1000 * 60 * 60 * 24));
        return res.status(403).json({ message: `Your account is suspended: ${reason}. Time left: ${timeLeft} days` });
      }else {
        // Automatically reactivate account after suspension period
      user.status.state = 'active';
      user.status.reason = '';
      user.status.lastUpdated = new Date();
      await user.save();
    }
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        hasOnboarded: user.hasOnboarded
      }
    });
    console.log(`User "${user.username}" logged in successfully`);
  } catch (error) {
    console.error(`User "${user.username}" login failed`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google OAuth routes
router.get('/google', authenticateGoogle);

router.get('/google/callback', passport.authenticate('google', { session: false }),(req, res) => {
    const token = generateToken(req.user);
    // Update last active timestamp
    req.user.lastActive = new Date();
    req.user.save();
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', authenticateJWT, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      avatar: req.user.avatar,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
      likesProducts: req.user.likedProducts || [],
      hasOnboarded: req.user.hasOnboarded,
      preferences: req.user.preferences || {},
      status: req.user.status.state,
    }
  });
});

module.exports = router;


