const mongoose = require('mongoose');

const EnhancementCacheSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sourceHash: { type: String, required: true }, // sha256 of input (file content or URL)
    preset: { type: String, required: true, default: 'standard' },

    // Original asset info
    originalUrl: { type: String },
    originalPublicId: { type: String },

    // Enhanced asset info (stored as a separate Cloudinary asset)
    enhancedUrl: { type: String, required: true },
    enhancedPublicId: { type: String, required: true },
  },
  { timestamps: true }
);

// Uniqueness: one enhanced asset per user + source + preset
EnhancementCacheSchema.index({ userId: 1, sourceHash: 1, preset: 1 }, { unique: true });

module.exports = mongoose.model('EnhancementCache', EnhancementCacheSchema);