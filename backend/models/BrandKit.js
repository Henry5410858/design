const mongoose = require('mongoose');

const BrandKitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  logo: String,
  brandName: String,
  tagline: String,
  colors: {
    primary: String,
    secondary: String,
    accent: String,
  },
  fonts: {
    heading: String,
    body: String,
  },
  font: String, // Keep for backward compatibility
}, { timestamps: true });

module.exports = mongoose.model('BrandKit', BrandKitSchema);
