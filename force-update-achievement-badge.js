const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Template schema
const CanvasObjectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'text', 'i-text', 'image', 'rect', 'rectangle', 'circle', 'triangle', 
      'polygon', 'path', 'rounded-rectangle', 'line', 'placeholder', 'shape'
    ], 
    required: true 
  },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  left: { type: Number },
  top: { type: Number },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  radius: { type: Number },
  text: { type: String },
  content: { type: String },
  fontSize: { type: Number, default: 48 },
  font: { type: String, default: 'Arial' },
  fontFamily: { type: String, default: 'Arial' },
  fontWeight: { type: String, default: 'normal' },
  textAlign: { type: String, default: 'left' },
  color: { type: String, default: '#000000' },
  fill: { type: String, default: '#000000' },
  stroke: { type: String, default: 'transparent' },
  borderColor: { type: String, default: 'transparent' },
  strokeWidth: { type: Number, default: 0 },
  borderWidth: { type: Number, default: 0 },
  strokeLineCap: { type: String, default: 'butt' },
  strokeLineJoin: { type: String, default: 'miter' },
  src: { type: String },
  url: { type: String },
  placeholder: { type: String },
  originalAspectRatio: { type: Number },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  rotation: { type: Number, default: 0 },
  angle: { type: Number, default: 0 },
  opacity: { type: Number, default: 1 },
  rx: { type: Number, default: 0 },
  ry: { type: Number, default: 0 },
  points: { type: [Number], default: [] },
  path: { type: String },
  shape: { type: String },
  isBackground: { type: Boolean, default: false },
  shadow: { type: mongoose.Schema.Types.Mixed },
  strokeDashArray: { type: mongoose.Schema.Types.Mixed },
  strokeDashOffset: { type: Number, default: 0 },
  strokeUniform: { type: Boolean, default: false },
  strokeMiterLimit: { type: Number, default: 4 },
  fillRule: { type: String, default: 'nonzero' },
  paintFirst: { type: String, default: 'fill' },
  globalCompositeOperation: { type: String, default: 'source-over' },
  skewX: { type: Number, default: 0 },
  skewY: { type: Number, default: 0 },
  flipX: { type: Boolean, default: false },
  flipY: { type: Boolean, default: false },
  gradientType: { type: mongoose.Schema.Types.Mixed },
  gradientColors: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['square-post', 'story', 'marketplace-flyer', 'fb-feed-banner', 'digital-badge', 'brochure'], required: true },
  category: { type: String, enum: ['social-posts', 'stories', 'flyers', 'banners', 'badges', 'documents', 'marketplace-flyers', 'fb-banners'], required: true },
  templateKey: { type: String, unique: true, sparse: true },
  thumbnail: { type: String, default: '/uploads/default-thumbnail.png' },
  fileUrl: { type: String },
  designFilename: { type: String },
  designfilepath: { type: String },
  objects: [CanvasObjectSchema],
  backgroundColor: { type: String, default: '#ffffff' },
  backgroundImage: { type: String },
  canvasSize: { type: String, default: '1200x1800' },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRealEstate: { type: Boolean, default: false }
}, { timestamps: true });

const Template = mongoose.model('Template', TemplateSchema);

async function forceUpdateAchievementBadge() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('Connected to MongoDB');

    // Read the design file
    const designFilePath = path.join(__dirname, 'uploads/designs/68b7784187672e7048b2bc9d.json');
    const designData = JSON.parse(fs.readFileSync(designFilePath, 'utf8'));
    
    console.log('Design data loaded:', {
      id: designData.id,
      objectsCount: designData.objects.length,
      canvasSize: designData.canvasSize,
      backgroundColor: designData.backgroundColor
    });

    // Find the Achievement Badge template
    const template = await Template.findOne({ 
      $or: [
        { designFilename: '68b7784187672e7048b2bc9d.json' },
        { templateKey: 'achievementBadge' },
        { _id: '68bad037fb4a121ba01d59db' }
      ]
    });
    
    if (!template) {
      console.log('❌ Achievement Badge template not found');
      return;
    }

    console.log('Found template:', {
      id: template._id,
      name: template.name,
      currentObjectsCount: template.objects.length,
      designFilename: template.designFilename,
      canvasSize: template.canvasSize,
      backgroundColor: template.backgroundColor
    });

    // Prepare objects with required x, y coordinates
    const updatedObjects = designData.objects.map(obj => ({
      ...obj,
      x: obj.left || 0,
      y: obj.top || 0
    }));

    // Parse canvas size to get dimensions
    const [width, height] = designData.canvasSize.split('x').map(Number);

    // Force update the template
    const updateResult = await Template.updateOne(
      { _id: template._id },
      {
        $set: {
          objects: updatedObjects,
          backgroundColor: designData.backgroundColor,
          canvasSize: designData.canvasSize,
          dimensions: {
            width: width || 600,
            height: height || 600
          }
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Achievement Badge template updated successfully!');
      console.log('Modified count:', updateResult.modifiedCount);
      
      // Verify the update
      const verifyTemplate = await Template.findById(template._id);
      console.log('Verification - Objects count:', verifyTemplate.objects.length);
      console.log('Canvas size:', verifyTemplate.canvasSize);
      console.log('Background color:', verifyTemplate.backgroundColor);
      
      // Show first object details
      if (verifyTemplate.objects.length > 0) {
        console.log('First object:', {
          type: verifyTemplate.objects[0].type,
          fill: verifyTemplate.objects[0].fill,
          left: verifyTemplate.objects[0].left,
          top: verifyTemplate.objects[0].top
        });
      }
    } else {
      console.log('❌ Template update failed - no documents modified');
    }

  } catch (error) {
    console.error('Error updating template:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

forceUpdateAchievementBadge();

