const express = require('express');
const router = express.Router();
const { authenticateJWT , optionalAuth } = require('../middleware/auth');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Tag = require('../models/Tag'); 
const Brand = require("../models/Brand");
const ProductView = require('../models/ProductView'); // Import the ProductView model
const { uploadProduct } = require('../middleware/uploadMiddleware'); // Import the upload middleware
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');
const { cloudinary } = require('../config/cloudinaryConfig'); // Import Cloudinary config
const { moderatePost,moderateImage } = require('../config/google-vision'); // Import Google Vision label detection function
const { createNotification } = require('../services/notifyService');
const { getIO } = require('../socketServer');
const {getRecommendations } = require('../services/recoService');



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

    const baseSlug = slugifyThai(title);
    const slug = `${baseSlug}-${uuidv4()}`;

    // Validate
    if (!title || !price || !category || !brand || !details || !condition || !rarity || !tags) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const imageUrls = (req.files || []).map(file => file.path);
    if (!imageUrls.length) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // ✅ ตรวจรูปทั้งโพสต์ทีเดียว
    const { final, results } = await moderatePost(imageUrls);

    if (final === 'rejected') {
      // ลบรูปทั้งหมดที่อัปโหลด (rollback media)
      try { await deleteCloudinaryImages(imageUrls); } catch (e) { console.warn('Cloudinary cleanup error:', e); }
      return res.status(400).json({
        message: 'รูปภาพไม่ผ่านเกณฑ์การตรวจสอบ',
        moderation: { final, results },
      });
    }

    const status = final === 'approved' ? 'Published' : 'Pending';

    const newProduct = await Product.create({
      title,
      slug,
      price,
      category,
      brand,
      images: imageUrls,
      details,
      condition,
      rarity,
      tags: Array.isArray(tags) ? tags : [tags],
      seller: userId,
      status,
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
      moderation: { final, results }, // ส่งผลตรวจกลับให้ UI ถ้าจะโชว์
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Failed to create product' });
  }
});


// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, brand, tags, rarity, seller } = req.query;

    // -------- Build base filter (เหมือนเดิม) --------
    const filter = {
      status: { $ne: 'Hidden' }
    };
    if (category) filter.category = category;
    if (brand)    filter.brand = brand;
    if (rarity)   filter.rarity = rarity;

    if (tags) {
      const tagArr = String(tags).split(',').map(s => s.trim()).filter(Boolean);
      if (tagArr.length) filter.tags = { $in: tagArr };
    }

    // seller: username -> _id (ไม่เจอ = คืนว่าง)
    if (seller) {
      const s = await User.findOne({ username: seller }).select('_id').lean();
      if (!s) return res.status(200).json([]);
      filter.seller = s._id;
    }
    // -------- Aggregate + lookup เฉพาะ seller ที่ active --------
    const pipeline = [
      { $match: filter },

      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            // ✅ ตัดผู้ใช้ที่โดนแบน/ระงับ (เราเอา inactive ออกแล้ว เหลือ active/suspended/banned)
            { $match: { 'status.state': 'active' } },
            { $project: { _id: 1, avatar: 1, username: 1, name: 1, emailVerified: 1 } },
          ],
        },
      },
      // ถ้า lookup ไม่เจอ (เช่น seller ถูกแบน/ระงับ) -> ตัดสินค้าออก
      { $match: { seller: { $ne: [] } } },
      { $unwind: '$seller' },
    ];

    const items = await Product.aggregate(pipeline).allowDiskUse(true);

    // ส่งทรงเดียวกับเดิม (มี seller ที่ถูก "populate" แล้ว)
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

router.get('/published', async (req, res) => {
  try {
    const {
      category,
      condition,
      brand,
      tags,           // ← ชื่อแท็กคั่นด้วย comma หรือจะเป็น _id ก็ได้
      rarity,
      seller,         // username
      minPrice,
      maxPrice,
      q,
      limit = 24,
      cursor,         // ISO date ของ createdAt จากเพจก่อนหน้า
      lastId,         // (ทางเลือก) _id ของแถวท้ายสุดเพจก่อนหน้า (tie-breaker)
    } = req.query;

    const lim = Math.min(Number(limit) || 24, 100);

    // ---------- 1) สร้าง filter พื้นฐาน ----------
    const filter = {
      status: 'Published',
      isSold: false,
    };
    if (category)  filter.category  = category;
    if (condition) filter.condition = condition;
    //if (brand)     filter.brand     = brand;
    if (rarity)    filter.rarity    = rarity;

    // ราคา (number)
    const minP = minPrice != null ? Number(minPrice) : null;
    const maxP = maxPrice != null ? Number(maxPrice) : null;
    if (Number.isFinite(minP) || Number.isFinite(maxP)) {
      filter.price = {};
      if (Number.isFinite(minP)) filter.price.$gte = minP;
      if (Number.isFinite(maxP)) filter.price.$lte = maxP;
    }
      if (brand) {
  if (!isValidObjectId(brand)) {
    // กันกรณีส่งค่าพัง ๆ มา จะได้ไม่ query ทั้งคอลเลกชัน
    return res.status(200).json({ items: [], nextCursor: null });
  }
  const brandId = new mongoose.Types.ObjectId(brand);

  // ใช้ $graphLookup หา "ลูกทุกชั้น" ของ brandId
  const tree = await Brand.aggregate([
    { $match: { _id: brandId } },
    {
      $graphLookup: {
        from: 'brands',            // ชื่อคอลเลกชันแบรนด์
        startWith: '$_id',         // เริ่มจาก _id ของแบรนด์นี้
        connectFromField: '_id',   // ต่อจาก _id ปัจจุบัน
        connectToField: 'parent',  // ไปยังฟิลด์ parent ของแบรนด์อื่น
        as: 'descendants',         // เก็บผลไว้ในฟิลด์ชั่วคราว
        depthField: 'depth'        // (ไม่จำเป็น) อยากรู้ความลึกก็ได้
      }
    },
    {
      $project: {
        allIds: {
          // รวม _id ของตัวเอง + ลูกทั้งหมด
          $concatArrays: [
            ['$_id'],
            { $map: { input: '$descendants', as: 'd', in: '$$d._id' } }
          ]
        }
      }
    }
  ]);

  const brandIds = tree?.[0]?.allIds || [brandId]; // เผื่อกรณีไม่พบ tree
  filter.brand = { $in: brandIds };
}

// ---------- 2) seller: username -> _id ----------
if (seller) {
  const sellerUser = await User.findOne({ username: seller })
    .select('_id')
    .lean();
      if (!sellerUser) return res.status(200).json({ items: [], nextCursor: null });
      filter.seller = sellerUser._id;
    }

    // ---------- 3) tags: name/slug/_id -> tagIds ----------
    if (tags) {
      const raw = String(tags)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (raw.length) {
        // แบ่งเป็น 2 กลุ่ม: ที่เป็น ObjectId อยู่แล้ว กับที่เป็นชื่อ/slug
        const asIds  = raw.filter(isValidObjectId).map(id => new mongoose.Types.ObjectId(id));
        const asText = raw.filter(t => !isValidObjectId(t));

        let tagIds = [...asIds];

        if (asText.length) {
          // หาแท็กด้วย name หรือ slug (ถ้ามีใน schema)
          const found = await Tag.find({
            $or: [
              { name: { $in: asText } },
              { slug: { $in: asText.map(t => t.toLowerCase()) } }, // ถ้าไม่มี slug ลบบรรทัดนี้ได้
            ],
          }).select('_id').lean();

          tagIds.push(...found.map(d => d._id));
        }

        // ถ้าหาไม่เจอเลย → return ว่างเร็ว ๆ (จะได้ไม่ query ใหญ่)
        if (tagIds.length === 0) {
          return res.status(200).json({ items: [], nextCursor: null });
        }

        // product.tags เป็น ObjectId[] → ใช้ $in
        filter.tags = { $in: tagIds };
      }
    }

    // ---------- 4) keyword (text search) ----------
    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    // ---------- 5) cursor-based pagination ----------
    const sort = q
      ? { score: { $meta: 'textScore' }, createdAt: -1, _id: -1 }
      : { createdAt: -1, _id: -1 };

    const cursorCond = {};
    if (cursor) {
      const curDate = new Date(cursor);
      if (!isNaN(curDate)) {
        // ใช้ _id เป็น tie-breaker เมื่อ createdAt เท่ากัน
        cursorCond.$or = [
          { createdAt: { $lt: curDate } },
          {
            createdAt: curDate,
            _id: { $lt: isValidObjectId(lastId) ? new mongoose.Types.ObjectId(lastId) : new mongoose.Types.ObjectId('ffffffffffffffffffffffff') },
          },
        ];
      }
    }

    // ---------- 6) pipeline แบบเบา (lookup เฉพาะฟิลด์จำเป็น) ----------
    const pipeline = [
      { $match: filter },
      ...(cursorCond.$or ? [{ $match: cursorCond }] : []),

      { $project: {
          title: 1,
          slug: 1,
          price: 1,
          images: { $slice: ['$images', 1] },
          category: 1,
          brand: 1,
          tags: 1,
          condition: 1,
          rarity: 1,
          seller: 1,
          createdAt: 1,
          ...(q ? { score: { $meta: 'textScore' } } : {}),
      } },

      { $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            { $match: { "status.state": "active" } },
            { $project: { _id: 1, username: 1, avatar: 1, name: 1, emailVerified: 1 } },
          ],
      } },

      { $match: { seller: { $ne: [] } } },
      { $unwind: '$seller' },
      { $sort: sort },
      { $limit: lim + 1 }, // +1 เพื่อเช็คว่ามีหน้าถัดไปไหม
    ];

    const docs = await Product.aggregate(pipeline).allowDiskUse(true);
    const hasNext = docs.length > lim;
    const items = hasNext ? docs.slice(0, lim) : docs;

    const last = items[items.length - 1];
    const nextCursor = hasNext && last ? last.createdAt : null;
    const nextLastId = hasNext && last ? last._id : null;

    // ส่ง lastId กลับไปด้วย (ถ้าจะใช้ tie-breaker ที่ฝั่ง client)
    res.json({ items, nextCursor, nextLastId });
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
      title, price, category, brand, details, condition, rarity, tags, 
      existingImages, imagesToDelete 
    } = req.body;
    const userId = req.user._id;

    const product = await Product.findOne({ slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!product.seller.equals(userId)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // เตรียมรายการรูปที่จะเหลืออยู่หลังอัปเดต
    const imagesToDeleteArr = imagesToDelete
      ? (Array.isArray(imagesToDelete) ? imagesToDelete : [imagesToDelete])
      : [];

    if (imagesToDeleteArr.length > 0) {
      try { await deleteCloudinaryImages(imagesToDeleteArr); } 
      catch (e) { console.warn('Cloudinary deletion error:', e); }
    }

    let updatedImages = [];
    if (existingImages) {
      const existing = Array.isArray(existingImages) ? existingImages : [existingImages];
      updatedImages = existing.filter(img => !imagesToDeleteArr.includes(img));
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      newImageUrls = req.files.map(f => f.path);
      updatedImages = [...updatedImages, ...newImageUrls];
    }

    if (updatedImages.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }
    if (updatedImages.length > 4) {
      return res.status(400).json({ message: 'Maximum 4 images allowed' });
    }

    // ✅ ตรวจ “รูปชุดที่จะบันทึกจริง” ทั้งหมดอีกครั้ง
    const { final, results } = await moderatePost(updatedImages);

    if (final === 'rejected') {
      // rollback: ลบเฉพาะ "รูปใหม่" ที่เพิ่งอัปโหลดในรอบนี้
      if (newImageUrls.length) {
        try { await deleteCloudinaryImages(newImageUrls); } 
        catch (e) { console.warn('cleanup new images error:', e); }
      }
      return res.status(400).json({
        message: 'รูปภาพหลังแก้ไขไม่ผ่านเกณฑ์การตรวจสอบ',
        moderation: { final, results },
      });
    }

    // อัปเดตฟิลด์
    product.title = title;
    product.price = price;
    product.category = category;
    product.brand = brand;
    product.details = details;
    product.condition = condition;
    product.rarity = rarity;
    if (tags) product.tags = Array.isArray(tags) ? tags : [tags];

    product.images = updatedImages;

    // อัปเดตสถานะตามผลตรวจ
    product.status = (final === 'approved') ? 'Published' : 'Pending';

    await product.save();

    const updatedProduct = await Product.findOne({ slug })
      .populate('seller', 'avatar username name emailVerified')
      .populate('tags', 'name')
      .populate('brand', 'name');

    return res.status(200).json({ 
      message: 'Product updated successfully', 
      product: updatedProduct,
      moderation: { final, results },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ 
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

// LIKE (idempotent) - PUT /api/products/:slug/like
router.put('/:slug/like', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id.toString();

    // ต้องใช้ title+seller เพื่อแจ้งเตือน
    const product = await Product.findOne({ slug })
      .select('_id title seller likes')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const sellerId = product.seller?.toString();
    const isOwner = sellerId === userId;

    // ใส่ไลค์แบบ idempotent
    const upd = await Product.updateOne(
      { _id: product._id },
      { $addToSet: { likes: userId } }
    );

    // (ออปชัน) sync ไปที่โปรไฟล์ผู้ใช้
    await User.updateOne(
      { _id: userId },
      { $addToSet: { likedProducts: product._id } }
    ).catch(() => {});

    // ถ้าเพิ่งถูกเพิ่มจริง → ค่อยแจ้งเตือนผู้ขาย (และไม่แจ้งเตือนถ้าตัวเองคือเจ้าของ)
    if (!isOwner && sellerId && upd.modifiedCount === 1) {
      const notif = await createNotification({
        recipient: sellerId,
        actor: userId,
        type: 'like',
        title: 'มีคนถูกใจสินค้าของคุณ',
        body: product.title ? `มีคนถูกใจ: ${product.title}` : '',
        refModel: 'Product',
        refId: product._id,
        refSlug: product.slug || slug,
        collapseKey: `like:${product._id}:${userId}`, // กันสแปมต่อคน-ต่อสินค้า
      });

      const io = getIO && getIO();
      if (io && notif) io.to(`user:${sellerId}`).emit('notify', notif);
    }

    const fresh = await Product.findById(product._id).select('likes').lean();
    return res.json({
      success: true,
      isLiked: true,
      likesCount: fresh?.likes?.length || 0,
      message: 'Product liked',
    });
  } catch (error) {
    console.error('PUT like error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// UNLIKE (idempotent) - DELETE /api/products/:slug/like
router.delete('/:slug/like', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id.toString();

    const product = await Product.findOne({ slug })
      .select('_id likes')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const upd = await Product.updateOne(
      { _id: product._id },
      { $pull: { likes: userId } }
    );

    // (ออปชัน) sync โปรไฟล์ผู้ใช้
    await User.updateOne(
      { _id: userId },
      { $pull: { likedProducts: product._id } }
    ).catch(() => {});

    const fresh = await Product.findById(product._id).select('likes').lean();
    return res.json({
      success: true,
      isLiked: false,
      likesCount: fresh?.likes?.length || 0,
      message: 'Product unliked',
      // tip: upd.modifiedCount === 1 แปลว่าเพิ่งเอาออกจริง
    });
  } catch (error) {
    console.error('DELETE like error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// CHECK like status - GET /api/products/:slug/like-status
router.get('/:slug/like-status', authenticateJWT, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id.toString();

    const product = await Product.findOne({ slug })
      .select('_id likes')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const isLiked = (product.likes || []).some(id => id.toString() === userId);
    return res.json({
      isLiked,
      likesCount: product.likes?.length || 0,
    });
  } catch (error) {
    console.error('Get like status error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:slug/view', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId, sessionId } = req.body; // ip, userAgent ไม่ต้องรับจาก client แล้ว
    const { ip, userAgent, referrer } = req.clientMeta || {};

    const product = await Product.findOne({ slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (userId && product.seller.toString() === userId) {
      return res.json({
        success: true, viewCounted: false, viewsCount: product.views,
        message: 'Own product view not counted'
      });
    }

    const oneDayAgo = new Date(Date.now() - 24*60*60*1000);
    let shouldCountView = true;

    if (userId) {
      const recent = await ProductView.findOne({
        product: product._id,
        userId,
        createdAt: { $gte: oneDayAgo }
      });
      shouldCountView = !recent;
    } else {
      const recent = await ProductView.findOne({
        product: product._id,
        $or: [{ sessionId }, { ip }],
        createdAt: { $gte: oneDayAgo }
      });
      shouldCountView = !recent;
    }

    if (shouldCountView) {
      // ใช้ $inc จะเบากว่า
      await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });

      await ProductView.create({
        product: product._id,
        userId: userId || null,
        sessionId,
        ip,
        userAgent,
        referrer
      });

      // อ่านค่าปัจจุบันกลับ (optional) หรือให้ client ดึงใหม่ตอนหน้า
      const fresh = await Product.findById(product._id).select('views').lean();

      return res.json({
        success: true,
        viewCounted: true,
        viewsCount: fresh?.views ?? product.views + 1,
        message: 'View counted successfully'
      });
    }

    const fresh = await Product.findById(product._id).select('views').lean();
    return res.json({
      success: true, viewCounted: false, viewsCount: fresh?.views ?? product.views,
      message: 'Duplicate view not counted'
    });
  } catch (e) {
    console.error('View tracking error:', e);
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
// Get random products
router.get('/randoms/item', async (req, res) => {
  try {
    let { limit = 8 } = req.query;
    const lim = Math.min(Math.max(parseInt(limit) || 8, 1), 20);

    // เงื่อนไขพื้นฐาน
    const match = {
      status: 'Published',
      isSold: false,
    };

    const pipeline = [
      { $match: match },
      { $sample: { size: lim } },  // สุ่มหลังจากกรองแล้ว -> เร็วกว่า
      { $project: {
          title: 1,
          slug: 1,
          price: 1,
          images: { $slice: ['$images', 1] },
          category: 1,
          brand: 1,
          rarity: 1,
          condition: 1,
          seller: 1,
          createdAt: 1,
        }
      },
      { $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [{ $project: { _id: 1, username: 1, name: 1, avatar: 1 } }]
      }},
      { $match: { seller: { $ne: [] } } },
      { $unwind: '$seller' },
    ];

    const docs = await Product.aggregate(pipeline).allowDiskUse(true); 
    return res.json({ items: docs });
  } catch (err) {
    console.error('random products error:', err);
    res.status(500).json({ message: 'Failed to fetch random products' });
  }
});
// Get recommendations
router.get('/recommends/item', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const excludeProductId = req.query.exclude || null;

    let userDoc = null;
    if (req.user?._id) {
      userDoc = await User.findById(req.user._id).select('preferences likedProducts').lean();
    }

    // ถ้าไม่ล็อกอิน → ทำโหมด guest: ไม่มี prior/behavior มีแต่ popularity
    const fakeUser = userDoc || { preferences: null, likedProducts: [] };

    const recos = await getRecommendations({ user: fakeUser, limit, excludeProductId });
    // ส่งเฉพาะ fields ที่ต้องใช้แสดงผล
    res.json({
      items: recos.map(r => ({
        score: r.score,
        parts: r.parts,
        product: {
          _id: r.product._id,
          title: r.product.title,
          slug: r.product.slug,
          price: r.product.price,
          condition: r.product.condition,
          rarity: r.product.rarity,
          images: [r.product.images] || [] || null,
          category: r.product.category,
          brand: r.product.brand,
          tags: r.product.tags,
          seller: r.product.seller,
        }
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message:'Failed to fetch recommendations' });
  }
});

module.exports = router;