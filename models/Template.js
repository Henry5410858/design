const mongoose = require('mongoose');

const CanvasObjectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'rect', 'circle', 'i-text'], required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  text: { type: String },
  fontSize: { type: Number, default: 48 },
  font: { type: String, default: 'Arial' },
  fontFamily: { type: String, default: 'Arial' },
  fontWeight: { type: String, default: 'normal' },
  textAlign: { type: String, default: 'left' },
  color: { type: String, default: '#000000' },
  fill: { type: String, default: '#000000' },
  stroke: { type: String, default: 'transparent' },
  src: { type: String },
  placeholder: { type: String },
  originalAspectRatio: { type: Number },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  angle: { type: Number, default: 0 },
  isBackground: { type: Boolean, default: false }
}, { _id: false });

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['flyer', 'banner', 'story', 'document', 'badge', 'social', 'brochure'], required: true },
  category: { type: String, enum: ['social-posts', 'stories', 'flyers', 'banners', 'badges', 'documents'], required: true },
  templateKey: { type: String, unique: true, sparse: true }, // For real estate templates
  thumbnail: {
    type: String,
    default: '/uploads/default-thumbnail.png'
  },
  fileUrl: { type: String },
  objects: [CanvasObjectSchema],
  backgroundColor: { type: String, default: '#ffffff' },
  backgroundImage: { type: String },
  canvasSize: { type: String, default: '1200x1800' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDefault: { type: Boolean, default: false },
  isRealEstate: { type: Boolean, default: false } // Flag for real estate templates
}, { timestamps: true });

// Index for faster queries
TemplateSchema.index({ type: 1 });
TemplateSchema.index({ category: 1 });
TemplateSchema.index({ isDefault: 1 });
TemplateSchema.index({ isRealEstate: 1 });
TemplateSchema.index({ templateKey: 1 });

module.exports = mongoose.model('Template', TemplateSchema);
