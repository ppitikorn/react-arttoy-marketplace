const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const ProductView = require('../models/ProductView'); // Import the ProductView model
const { uploadProduct } = require('../middleware/uploadMiddleware'); // Import the upload middleware
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');
const { cloudinary } = require('../config/cloudinaryConfig'); // Import Cloudinary config
const { detectLabels } = require('../config/google-vision'); // Import Google Vision label detection function

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  try {
    // Extract public ID from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
    const parts = cloudinaryUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
      // Get everything after 'upload/v1234567890/' or 'upload/'
      let publicIdParts = parts.slice(uploadIndex + 1);
      // Remove version number if present (starts with 'v' followed by numbers)
      if (publicIdParts[0] && publicIdParts[0].match(/^v\d+$/)) {
        publicIdParts = publicIdParts.slice(1);
      }
      // Join remaining parts and remove file extension
      const publicIdWithExt = publicIdParts.join('/');
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
      return publicId;
    }
  } catch (error) {
    console.error('Error extracting public ID from URL:', cloudinaryUrl, error);
  }
  return null;
};

// Helper function to delete images from Cloudinary
const deleteCloudinaryImages = async (imageUrls) => {
  const deletionResults = [];
  
  for (const imageUrl of imageUrls) {
    try {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        console.log(`Attempting to delete image with public ID: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary deletion result for ${publicId}:`, result);
        deletionResults.push({ url: imageUrl, publicId, result });
      } else {
        console.warn(`Could not extract public ID from URL: ${imageUrl}`);
        deletionResults.push({ url: imageUrl, publicId: null, result: 'failed_to_extract_id' });
      }
    } catch (error) {
      console.error(`Error deleting image ${imageUrl} from Cloudinary:`, error);
      deletionResults.push({ url: imageUrl, error: error.message });
    }
  }
  
  return deletionResults;
};

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
    console.log('Uploaded image URLs:', imageUrls);
    if(imageUrls){
      imageUrls.forEach(async (imageUrl) => {
        const isFriendly = await detectLabels(imageUrl);
        if (isFriendly) {
          console.log(`Image ${imageUrl} is friendly and colorful.`);
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
        } else {
          console.log(`Image ${imageUrl} is not friendly or colorful, rejecting product creation.`);
          // Delete all product images from Cloudinary
          if (imageUrls && imageUrls.length > 0) {
            console.log('Deleting all product images from Cloudinary:', imageUrls);
            try {
              const deletionResults = await deleteCloudinaryImages(imageUrls);
              console.log('Cloudinary deletion results:', deletionResults);
            } catch (error) {
              console.error('Error deleting product images from Cloudinary:', error);
              // Continue with product deletion even if image deletion fails
            }
          }
          return res.status(400).json({ message: 'Image does not meet friendly and colorful criteria' });
        }
      });
    }
    // // Create a new product
    // const newProduct = new Product({
    //   title,
    //   slug,
    //   price,
    //   category,
    //   brand,
    //   images: imageUrls,
    //   details,
    //   condition,
    //   rarity,
    //   tags,
    //   seller: userId,
    // });

    // await newProduct.save();
    // res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, brand, tags, rarity, seller } = req.query;

    // Build the filter object
    const filter = {};
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (rarity) filter.rarity = rarity;
    
    // Filter by seller username
    if (seller) {
      const sellerUser = await User.findOne({ username: seller });
      if (sellerUser) {
        filter.seller = sellerUser._id;
      } else {
        return res.status(200).json([]); // Return empty array if seller not found
      }
    }

    const products = await Product.find(filter).populate('seller', 'avatar username name emailVerified'); // Populate seller info
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

//Get products by isSold = false status = published // Add filter for published products
router.get('/published', async (req, res) => {
  try {
    const { category, brand, tags, rarity, seller } = req.query;
    // Build the filter object
    const filter = {};
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (rarity) filter.rarity = rarity;
    
    // Filter by seller username
    if (seller) {
      const sellerUser = await User.findOne({ username: seller });
      if (sellerUser) {
        filter.seller = sellerUser._id;
      } else {
        return res.status(200).json([]); // Return empty array if seller not found
      }
    }
    const products = await Product.find({ isSold: false, status: 'Published', ...filter })
      .populate('seller', 'avatar username name emailVerified');
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching published products:', error);
    res.status(500).json({ message: 'Failed to fetch published products' });
  }
});


// Get a single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).populate('seller', 'avatar username name emailVerified').populate('tags', 'name').populate('brand', 'name'); // Populate seller and tags info
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});
// Update a product by slug
router.put('/:slug', authenticateJWT, uploadProduct.array('newImages', 5), async (req, res) => {
  try {
    const { slug } = req.params;
    const { 
      title, 
      price, 
      category, 
      brand, 
      details, 
      condition, 
      rarity, 
      tags, 
      existingImages, 
      imagesToDelete 
    } = req.body;
    const userId = req.user._id;
    
    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (!product.seller.equals(userId)) {
      console.log('Unauthorized access attempt by user:', userId);
      console.log('Product seller ID:', product.seller);
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Update product fields
    product.title = title;
    product.price = price;
    product.category = category;
    product.brand = brand;
    product.details = details;
    product.condition = condition;
    product.rarity = rarity;
    
    // Handle tags (ensure it's an array)
    if (tags) {
      product.tags = Array.isArray(tags) ? tags : [tags];
    }    // Handle image updates
    let updatedImages = [];
    const imagesToDeleteArray = imagesToDelete ? (Array.isArray(imagesToDelete) ? imagesToDelete : [imagesToDelete]) : [];
    
    // Delete images from Cloudinary if there are any marked for deletion
    if (imagesToDeleteArray.length > 0) {
      console.log('Deleting images from Cloudinary:', imagesToDeleteArray);
      try {
        const deletionResults = await deleteCloudinaryImages(imagesToDeleteArray);
        console.log('Cloudinary deletion results:', deletionResults);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with the update even if image deletion fails
      }
    }
    
    // Add existing images that are not marked for deletion
    if (existingImages) {
      const existingImagesArray = Array.isArray(existingImages) ? existingImages : [existingImages];
      updatedImages = existingImagesArray.filter(img => !imagesToDeleteArray.includes(img));
    }
    
    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => file.path);
      updatedImages = [...updatedImages, ...newImageUrls];
    }
    
    // Ensure at least one image exists
    if (updatedImages.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }
    
    // Limit to maximum 4 images
    if (updatedImages.length > 4) {
      return res.status(400).json({ message: 'Maximum 4 images allowed' });
    }
    
    product.images = updatedImages;

    await product.save();
    
    // Populate the response with complete data
    const updatedProduct = await Product.findOne({ slug })
      .populate('seller', 'avatar username name emailVerified')
      .populate('tags', 'name')
      .populate('brand', 'name');
    
    res.status(200).json({ 
      message: 'Product updated successfully', 
      product: updatedProduct 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Failed to update product',
      error: error.message 
    });
  }
});

// Patch product mark as sold
router.patch('/:slug/sold', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;


    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (!product.seller.equals(userId)) {
      console.log('Unauthorized access attempt by user:', userId);
      console.log('Product seller ID:', product.seller);
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    const currentIsSold = product.isSold;
    product.isSold = !currentIsSold; // Toggle isSold status
    await product.save();

    res.status(200).json({ message: 'Product marked as sold', product });
  } catch (error) {
    console.error('Error marking product as sold:', error);
    res.status(500).json({ message: 'Failed to mark product as sold', error: error.message });
  }
});

// Delete a product by slug
router.delete('/:slug', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;
    
    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (!product.seller.equals(userId)) {
      console.log('Unauthorized delete attempt by user:', userId);
      console.log('Product seller ID:', product.seller);
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Delete all product images from Cloudinary
    if (product.images && product.images.length > 0) {
      console.log('Deleting all product images from Cloudinary:', product.images);
      try {
        const deletionResults = await deleteCloudinaryImages(product.images);
        console.log('Cloudinary deletion results:', deletionResults);
      } catch (error) {
        console.error('Error deleting product images from Cloudinary:', error);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete the product from database
    await Product.findOneAndDelete({ slug });
    
    res.status(200).json({ 
      message: 'Product deleted successfully',
      deletedProduct: {
        title: product.title,
        slug: product.slug
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      message: 'Failed to delete product',
      error: error.message 
    });
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

router.post('/:slug/view', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId, sessionId, userAgent, ip } = req.body;

    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Don't count view if user is the seller
    if (userId && product.seller.toString() === userId) {
      return res.json({
        success: true,
        viewCounted: false,
        viewsCount: product.views,
        message: 'Own product view not counted'
      });
    }

    // Check for duplicate views (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let shouldCountView = true;
    
    if (userId) {
      // For logged-in users: check if they viewed this product recently
      const recentView = await ProductView.findOne({
        product: product._id,
        userId: userId,
        createdAt: { $gte: oneDayAgo }
      });
      shouldCountView = !recentView;
    } else {
      // For anonymous users: check by session/IP
      const recentView = await ProductView.findOne({
        product: product._id,
        $or: [
          { sessionId: sessionId },
          { ip: ip }
        ],
        createdAt: { $gte: oneDayAgo }
      });
      shouldCountView = !recentView;
    }

    if (shouldCountView) {
      // Increment view counter
      product.views = (product.views || 0) + 1;
      await product.save();

      // Record the view for duplicate prevention
      const newView = new ProductView({
        product: product._id,
        userId: userId || null,
        sessionId: sessionId,
        ip: ip,
        userAgent: userAgent
      });
      await newView.save();

      res.json({
        success: true,
        viewCounted: true,
        viewsCount: product.views,
        message: 'View counted successfully'
      });
    } else {
      res.json({
        success: true,
        viewCounted: false,
        viewsCount: product.views,
        message: 'Duplicate view not counted'
      });
    }

  } catch (error) {
    console.error('View tracking error:', error);
    res.status(500).json({ message: 'Failed to track view' });
  }
});

// Get view analytics for a product (optional - for sellers)
router.get('/:slug/analytics', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;

    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Only seller can view analytics
    if (product.seller.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get view analytics
    const totalViews = product.views || 0;
    const uniqueViews = await ProductView.countDocuments({ product: product._id });
    const todayViews = await ProductView.countDocuments({
      product: product._id,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({
      totalViews,
      uniqueViews,
      todayViews,
      conversionRate: product.likes.length / totalViews * 100 || 0
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

module.exports = router;