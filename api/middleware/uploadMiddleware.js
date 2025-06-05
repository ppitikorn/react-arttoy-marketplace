// uploadMiddleware.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinaryConfig');

// Configure Cloudinary storage for profile images
const storageProfile = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'arttoy/profile',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // Resize images for optimization
    format: 'webp' // Convert all images to webp for consistency
  }
});
// Configure Cloudinary storage for product images
const storageProduct = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'arttoy/product',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }], // Resize images for optimization
    format: 'webp' // Convert all images to webp for consistency
  }
});

// Configure multer with file size limits and file type validation
const uploadProfile = multer({
  storage: storageProfile,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'), false);
      return;
    }
    cb(null, true);
  }
});
const uploadProduct = multer({
  storage: storageProduct,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'), false);
      return;
    }
    cb(null, true);
  }
});

module.exports = { uploadProfile, uploadProduct };
