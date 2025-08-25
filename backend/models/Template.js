const mongoose = require('mongoose');

const CanvasObjectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'rect'], required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  text: { type: String },
  font: { type: String, default: 'Arial' },
  color: { type: String, default: '#000000' },
  src: { type: String },
  placeholder: { type: String },
  originalAspectRatio: { type: Number }
}, { _id: false });

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['flyer', 'banner', 'story', 'document'], required: true },
  thumbnail: { 
    type: String, 
    default: '/uploads/default-thumbnail.png' // Default thumbnail path
  },
  fileUrl: { type: String },
  objects: [CanvasObjectSchema],
  backgroundColor: { type: String, default: '#ffffff' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDefault: { type: Boolean, default: false } // Flag for default templates
}, { timestamps: true });

// Index for faster queries
TemplateSchema.index({ type: 1 });
TemplateSchema.index({ isDefault: 1 });

module.exports = mongoose.model('Template', TemplateSchema);
