const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const EnhancementCache = require('../models/EnhancementCache');
const EnhancementUsage = require('../models/EnhancementUsage');

const router = express.Router();

// Use memory storage to avoid local disk writes
const upload = multer({ storage: multer.memoryStorage() });

// Preset map -> Cloudinary transformations
const PRESETS = {
  standard: [
    { effect: 'auto_brightness' },
    { effect: 'auto_color' },
    { effect: 'sharpen:100' },
    { effect: 'saturation:30' },
  ],
  vivid: [
    { effect: 'auto_brightness' },
    { effect: 'auto_color' },
    { effect: 'sharpen:150' },
    { effect: 'saturation:60' },
    { effect: 'contrast:20' },
  ],
  soft: [
    { effect: 'auto_brightness' },
    { effect: 'auto_color' },
    { effect: 'sharpen:50' },
    { effect: 'saturation:10' },
  ],
};

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function hashBufferOrString(input) {
  const h = crypto.createHash('sha256');
  if (Buffer.isBuffer(input)) h.update(input);
  else h.update(String(input));
  return h.digest('hex');
}

function buildUrl(publicId, preset) {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    transformation: PRESETS[preset] || PRESETS.standard,
  });
}

async function getOrInitUsage(userId, plan) {
  const key = monthKey();
  let doc = await EnhancementUsage.findOne({ userId, monthKey: key });
  if (!doc) {
    // Default quotas (can be overridden via env)
    const defaults = {
      Gratis: Number(process.env.QUOTA_GRATIS || 10),
      Premium: Number(process.env.QUOTA_PREMIUM || 1000),
      'Ultra-Premium': Number(process.env.QUOTA_ULTRA || 5000),
    };
    doc = await EnhancementUsage.create({ userId, monthKey: key, count: 0, quota: defaults[plan] ?? 10 });
  }
  return doc;
}

// POST /api/images/enhance
// Temporarily open for testing (no premium gating)
router.post('/enhance', auth, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || 'anonymous';
    const userPlan = req.user?.plan || 'Gratis';
    const preset = (req.body?.preset || 'standard').toLowerCase();
    const inputUrl = req.body?.url;

    if (!PRESETS[preset]) {
      return res.status(400).json({ message: `Invalid preset. Allowed: ${Object.keys(PRESETS).join(', ')}` });
    }

    // Compute cache key (hash of buffer or URL)
    const sourceHash = req.file ? hashBufferOrString(req.file.buffer) : inputUrl ? hashBufferOrString(inputUrl) : null;
    if (!sourceHash) return res.status(400).json({ message: 'No image provided' });

    // Check cache
    const cached = await EnhancementCache.findOne({ userId, sourceHash, preset });
    if (cached) {
      return res.json({
        url: cached.enhancedUrl,
        publicId: cached.enhancedPublicId,
        originalUrl: cached.originalUrl,
        originalPublicId: cached.originalPublicId,
        cached: true,
      });
    }

    // Quota (tracked, optionally enforced)
    const enforce = String(process.env.ENHANCE_ENFORCE_QUOTA || 'false').toLowerCase() === 'true';
    const usage = await getOrInitUsage(userId, userPlan);
    if (enforce && usage.count >= usage.quota) {
      return res.status(429).json({ message: 'Enhancement quota exceeded for this month' });
    }

    // 1) Upload original asset
    let originalUpload;
    if (req.file) {
      originalUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `users/${userId}/uploads` },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
    } else {
      originalUpload = await cloudinary.uploader.upload(inputUrl, { folder: `users/${userId}/uploads` });
    }

    const originalPublicId = originalUpload.public_id;
    const originalUrl = originalUpload.secure_url || originalUpload.url;

    // 2) Create enhanced asset as a separate Cloudinary asset
    const enhancedPublicIdBase = `${originalPublicId.split('/').pop()}__enhanced__${preset}`;
    const enhancedPublicId = `users/${userId}/enhanced/${enhancedPublicIdBase}`;

    // Upload using original URL as source with transformation to store as separate asset
    const enhancedUpload = await cloudinary.uploader.upload(originalUrl, {
      folder: `users/${userId}/enhanced`,
      public_id: enhancedPublicIdBase,
      overwrite: true,
      transformation: PRESETS[preset] || PRESETS.standard,
    });

    const enhancedUrl = enhancedUpload.secure_url || enhancedUpload.url || buildUrl(enhancedPublicId, preset);

    // Save cache entry
    await EnhancementCache.create({
      userId,
      sourceHash,
      preset,
      originalUrl,
      originalPublicId,
      enhancedUrl,
      enhancedPublicId: enhancedUpload.public_id || enhancedPublicId,
    });

    // Increment usage (no enforcement by default)
    usage.count += 1;
    await usage.save();

    return res.json({
      url: enhancedUrl,
      publicId: enhancedUpload.public_id || enhancedPublicId,
      originalUrl,
      originalPublicId,
      cached: false,
      preset,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Enhancement error', error: e.message });
  }
});

// GET /api/images/usage - current month usage/quota
router.get('/usage', auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userPlan = req.user?.plan || 'Gratis';
    const usage = await getOrInitUsage(userId, userPlan);
    res.json({ month: usage.monthKey, count: usage.count, quota: usage.quota });
  } catch (e) {
    res.status(500).json({ message: 'Usage fetch error', error: e.message });
  }
});

module.exports = router;