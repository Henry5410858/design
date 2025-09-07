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

async function syncDesignObjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('Connected to MongoDB');

    // Get all templates that have designFilename
    const templates = await Template.find({ designFilename: { $exists: true, $ne: null } });
    console.log(`Found ${templates.length} templates with designFilename`);

    for (const template of templates) {
      console.log(`\nProcessing template: ${template.name} (${template.designFilename})`);
      
      try {
        // Read the design file
        const designFilePath = path.join(__dirname, 'uploads/designs', template.designFilename);
        
        if (!fs.existsSync(designFilePath)) {
          console.log(`❌ Design file not found: ${template.designFilename}`);
          continue;
        }

        const designData = JSON.parse(fs.readFileSync(designFilePath, 'utf8'));
        console.log(`📁 Design file loaded: ${designData.objects.length} objects`);

        // Prepare objects with required x, y coordinates
        const updatedObjects = designData.objects.map(obj => ({
          ...obj,
          x: obj.left || 0,
          y: obj.top || 0
        }));

        // Parse canvas size to get dimensions
        const [width, height] = designData.canvasSize.split('x').map(Number);

        // Update the template
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
          console.log(`✅ Updated template: ${template.name}`);
          console.log(`   Objects: ${updatedObjects.length}`);
          console.log(`   Canvas: ${designData.canvasSize}`);
          console.log(`   Background: ${designData.backgroundColor}`);
        } else {
          console.log(`⚠️ No changes needed for: ${template.name}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${template.name}:`, error.message);
      }
    }

    console.log('\n🎉 Sync completed!');

  } catch (error) {
    console.error('Error syncing design objects:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

syncDesignObjects();

