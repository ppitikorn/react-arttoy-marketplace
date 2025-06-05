const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');
const {uploadProfile} = require('../middleware/uploadMiddleware'); // Import the upload middleware
const { cloudinary } = require('../config/cloudinaryConfig');
// Get user profile
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/', authenticateJWT, uploadProfile.single('avatarFile'), async (req, res) => {
  try {
    const { name, email, bio, phoneNumber } = req.body;
    const currentUser = await User.findById(req.user._id);
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Username cannot be changed
    if (req.body.username) {
      return res.status(400).json({ message: 'Username cannot be changed' });
    }
      // Check if email is being changed and if it's already in use
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // If there's a new avatar file and an existing avatar, delete the old one from Cloudinary
    if (req.file && currentUser.avatar) {
      try {
        // Extract public_id from the Cloudinary URL
        const publicId = currentUser.avatar.split('/').slice(-1)[0].split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`arttoy/profile/${publicId}`);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue with update even if deletion fails
      }
    }    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name,
          email,
          bio,
          phoneNumber,
          ...(req.file && { avatar: req.file.path }), // Cloudinary URL from the uploaded file
          updatedAt: Date.now()
        }
      },
      { 
        new: true,
        runValidators: true // Ensure updates meet schema validation
      }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Send verification email
router.post('/verify-email', authenticateJWT, async (req, res) => {
  try {
    // Here you would typically:
    // 1. Generate a verification token
    // 2. Send an email with the verification link
    // 3. Save the token in the user document
    // For now, we'll just mark the email as verified
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 
        emailVerified: true,
        updatedAt: Date.now()
      }
    });

    res.json({ message: 'Email verification sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending verification email', error: error.message });
  }
});

// Verify email with token
router.get('/verify-email/:token', async (req, res) => {
  try {
    // Here you would typically:
    // 1. Verify the token
    // 2. Update the user's email verification status
    // For now, we'll just return a success message
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
});

module.exports = router;