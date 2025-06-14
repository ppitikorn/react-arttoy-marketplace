const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');
const {uploadProfile} = require('../middleware/uploadMiddleware'); // Import the upload middleware
const { cloudinary } = require('../config/cloudinaryConfig');

// Use development email config if in development mode
const emailConfig = process.env.NODE_ENV === 'development' 
  ? require('../config/emailConfig.dev')
  : require('../config/emailConfig');

const { generateOTP, sendVerificationEmail } = emailConfig;
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

// Send verification email with OTP
router.post('/verify-email', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+emailVerificationOTP.code +emailVerificationOTP.expiresAt +emailVerificationOTP.attempts +emailVerificationOTP.sentAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Check rate limiting - 5 attempts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const currentAttempts = user.emailVerificationOTP.attempts;
    const lastSentTime = user.emailVerificationOTP.sentAt;
    const shouldResetAttempts = !lastSentTime || lastSentTime < oneHourAgo;

    console.log("********************************");
    console.log(`Last sent time: ${lastSentTime}, One hour ago: ${oneHourAgo}`);
    console.log(`Current attempts: ${currentAttempts}`);
    console.log(`Current Last sent time: ${lastSentTime}`);
    console.log("********************************");
    console.log(`Last attempt time: ${lastSentTime}`);
    console.log(`Last attempt time: ${!lastSentTime}`);
    console.log(`Current attempts: ${lastSentTime < oneHourAgo}`);
    console.log(`Should reset attempts: ${shouldResetAttempts}`);


    if (shouldResetAttempts && currentAttempts > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          'emailVerificationOTP.attempts': 0
        }
      });
    }

    const effectiveAttempts = shouldResetAttempts ? 0 : currentAttempts;

    // Check if user has exceeded maximum attempts
    if (effectiveAttempts >= 5) {
      const timeUntilReset = new Date(lastAttemptTime.getTime() + 60 * 60 * 1000); 
      const minutesLeft = Math.ceil((timeUntilReset - new Date()) / (1000 * 60)); 
      
      return res.status(429).json({ 
        message: `Too many verification attempts. Please try again in ${minutesLeft} minutes.`,
        canRequestNewIn: minutesLeft,
        attemptsLeft: 0
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const now = new Date();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const newAttempts = effectiveAttempts + 1;
    console.log(`Sending OTP: ${otp} to ${user.email} (Attempt ${newAttempts})`);
    console.log(`OTP expires at: ${expiresAt}`); // Log expiration time for debugging
    console.log(`Current attempts: ${currentAttempts}, effective attempts: ${effectiveAttempts}, New attempts: ${newAttempts}`);

    // Update user with new OTP
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'emailVerificationOTP.code': otp,
        'emailVerificationOTP.expiresAt': expiresAt,
        'emailVerificationOTP.attempts': newAttempts,
        'emailVerificationOTP.sentAt': now, // Track when the OTP was sent
        updatedAt: now
      }
    });// Send email
    const emailResult = await sendVerificationEmail(user.email, otp, user.name);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again later.' 
      });
    }

    // Log preview URL for development
    if (process.env.NODE_ENV === 'development' && emailResult.previewUrl) {
      console.log('Email preview URL:', emailResult.previewUrl);
    }    res.json({ 
      message: 'Verification email sent successfully. Please check your inbox.',
      expiresIn: '10 minutes',
      attemptsLeft: Math.max(0, 5 - newAttempts),
      totalAttempts: newAttempts,
      maxAttempts: 5,
      ...(process.env.NODE_ENV === 'development' && emailResult.previewUrl && {
        previewUrl: emailResult.previewUrl
      })
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ message: 'Error sending verification email', error: error.message });
  }
});

// Verify email with OTP
router.post('/verify-email-otp', authenticateJWT, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    // Remove any spaces and ensure it's a string
    const cleanOTP = otp.toString().replace(/\s/g, '');

    if (cleanOTP.length !== 6 || !/^\d{6}$/.test(cleanOTP)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' });
    }

    const user = await User.findById(req.user._id).select('+emailVerificationOTP.code +emailVerificationOTP.expiresAt +emailVerificationOTP.attempts');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (!user.emailVerificationOTP.code) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }

    // Check if OTP has expired
    if (new Date() > user.emailVerificationOTP.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP matches
    if (user.emailVerificationOTP.code !== cleanOTP) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // OTP is valid, verify the email
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        emailVerified: true,
        updatedAt: Date.now()
      },
      $unset: {
        'emailVerificationOTP.code': '',
        'emailVerificationOTP.expiresAt': '',
        'emailVerificationOTP.attempts': ''
      }
    });

    res.json({ 
      message: 'Email verified successfully!',
      emailVerified: true
    });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
});

// Get verification status
router.get('/verification-status', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emailVerified emailVerificationOTP.expiresAt emailVerificationOTP.attempts');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const otpExpired = user.emailVerificationOTP.expiresAt ? now > user.emailVerificationOTP.expiresAt : true;
    const currentAttempts = user.emailVerificationOTP.attempts || 0;
    
    // Check if attempts should be reset (more than 1 hour since last OTP)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const lastAttemptTime = user.emailVerificationOTP.expiresAt ? 
      new Date(user.emailVerificationOTP.expiresAt.getTime() - 10 * 60 * 1000) : null;
    const shouldResetAttempts = !lastAttemptTime || lastAttemptTime < oneHourAgo;
    
    let canRequestNew = true;
    let canRequestNewIn = 0;
    let effectiveAttempts = shouldResetAttempts ? 0 : currentAttempts;
    
    if (effectiveAttempts >= 5) {
      canRequestNew = false;
      const timeUntilReset = new Date(lastAttemptTime.getTime() + 60 * 60 * 1000);
      canRequestNewIn = Math.ceil((timeUntilReset - now) / (1000 * 60)); // minutes
    }
    
    const attemptsLeft = Math.max(0, 5 - effectiveAttempts);

    res.json({
      emailVerified: user.emailVerified,
      canRequestNew,
      canRequestNewIn, // minutes until can request again
      attemptsLeft,
      totalAttempts: effectiveAttempts,
      maxAttempts: 5,
      otpExpired,
      otpExpiresAt: user.emailVerificationOTP.expiresAt,
      lastAttemptTime: lastAttemptTime
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ message: 'Error getting verification status', error: error.message });
  }
});

// Get user profile by username (public) - MUST BE LAST to avoid path conflicts
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password -email -createdAt -updatedAt -oauthProviders -lastActive -likedProducts -interests -status -phoneNumber -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

module.exports = router;