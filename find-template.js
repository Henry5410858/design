const mongoose = require('mongoose');
require('dotenv').config();

// Simple template schema
const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  category: { type: String, required: true },
  templateKey: { type: String },
  thumbnail: { type: String },
  fileUrl: { type: String },
  designFilename: { type: String },
  designfilepath: { type: String },
  objects: { type: mongoose.Schema.Types.Mixed },
  backgroundColor: { type: String },
  backgroundImage: { type: String },
  canvasSize: { type: String },
  dimensions: { type: mongoose.Schema.Types.Mixed },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRealEstate: { type: Boolean, default: false }
}, { timestamps: true });

const Template = mongoose.model('Template', TemplateSchema);

async function findTemplate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('Connected to MongoDB');

    // Find all templates
    const templates = await Template.find({});
    console.log(`Found ${templates.length} templates:`);
    
    templates.forEach(template => {
      console.log(`- ${template.name} (${template._id})`);
      console.log(`  designFilename: ${template.designFilename}`);
      console.log(`  templateKey: ${template.templateKey}`);
      console.log(`  objects count: ${Array.isArray(template.objects) ? template.objects.length : 0}`);
      console.log('');
    });

    // Find Achievement Badge specifically
    const achievementBadge = await Template.findOne({ 
      $or: [
        { name: 'Achievement Badge' },
        { templateKey: 'achievementBadge' },
        { designFilename: '68b7784187672e7048b2bc9d.json' }
      ]
    });

    if (achievementBadge) {
      console.log('Achievement Badge found:', {
        id: achievementBadge._id,
        name: achievementBadge.name,
        designFilename: achievementBadge.designFilename,
        objectsCount: Array.isArray(achievementBadge.objects) ? achievementBadge.objects.length : 0
      });
    } else {
      console.log('Achievement Badge not found');
    }

  } catch (error) {
    console.error('Error finding template:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

findTemplate();

