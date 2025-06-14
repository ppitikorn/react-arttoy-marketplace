// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // This creates an index automatically
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true, // This creates an index automatically
    trim: true,
    lowercase: true
  },  
  password: {
    type: String,
    required: function() {
      // Only required if not using OAuth 
      return this.oauthProviders.length === 0;
    },
    select: false // Don't include password in queries by default
  },  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    code: {
      type: String,
      select: false // Don't include in queries by default
    },
    sentAt: {
      type: Date,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    },
    attempts: {
      type: Number,
      default: 0,
      select: false
    }
  },
  bio: {
    type: String,
    default: '',
    maxLength: 100
  },
  phoneNumber: {
    type: String,
    default: '',
    maxLength: 15
  },
  status: {
    state: {
      type: String,
      enum: ['active', 'inactive', 'banned', 'suspended'],
      default: 'active'
    },
    reason: {
      type: String,
      default: '',
      maxLength: 200
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  interests: [{
    type: String,
    trim: true
  }],
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  likedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  oauthProviders: [{
    providerName: {
      type: String,
      required: true,
      enum: ['google']
    },
    providerId: {
      type: String,
      required: true
    },
    accessToken: String,
    refreshToken: String
  }],
  lastActive: {
    type: Date,
    default: function() {
      return this.createdAt;
    }
  },
}, {
  timestamps: true
});

// Only create index for OAuth providers since it's a compound index
userSchema.index({ 'oauthProviders.providerId': 1, 'oauthProviders.providerName': 1 });

// Pre-save middleware to ensure username is set for OAuth users
userSchema.pre('save', function(next) {
  if (!this.username && this.email) {
    // Generate username from email if not provided
    this.username = this.email.split('@')[0];
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
