const mongoose = require('mongoose');
require('dotenv').config();

// Template schema
const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  templateKey: { type: String },
  isRealEstate: { type: Boolean, default: false },
  objects: [mongoose.Schema.Types.Mixed],
  backgroundColor: { type: String },
  backgroundImage: { type: String },
  canvasSize: { type: String },
  designFilename: { type: String },
  thumbnailFilename: { type: String },
  plan: { type: String, default: 'Gratis' }
}, { timestamps: true });

const Template = mongoose.model('Template', TemplateSchema);

async function findAchievementBadge() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('Connected to MongoDB');

    // Find all badge templates
    const badgeTemplates = await Template.find({ 
      $or: [
        { category: 'badge' },
        { category: 'badges' },
        { type: 'badge' }
      ]
    });
    
    console.log(`Found ${badgeTemplates.length} badge templates:`);
    badgeTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ID: ${template._id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Type: ${template.type}`);
      console.log(`   TemplateKey: ${template.templateKey}`);
      console.log('---');
    });

    // Also search for templates with "achievement" in the name
    const achievementTemplates = await Template.find({
      name: { $regex: /achievement/i }
    });
    
    console.log(`\nFound ${achievementTemplates.length} templates with "achievement" in name:`);
    achievementTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ID: ${template._id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Type: ${template.type}`);
      console.log(`   TemplateKey: ${template.templateKey}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error finding templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the search
findAchievementBadge();
