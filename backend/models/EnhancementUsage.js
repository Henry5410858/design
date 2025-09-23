const mongoose = require('mongoose');

const EnhancementUsageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    monthKey: { type: String, required: true }, // e.g., '2025-09'
    count: { type: Number, default: 0 },
    quota: { type: Number, default: 10 }, // configurable default for Gratis; higher for Premium
  },
  { timestamps: true }
);

EnhancementUsageSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('EnhancementUsage', EnhancementUsageSchema);