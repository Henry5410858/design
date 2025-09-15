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

async function updateAchievementBadgeSpanish() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('Connected to MongoDB');

    // Find the Achievement Badge template
    const template = await Template.findOne({ 
      $or: [
        { templateKey: 'achievementBadge' },
        { name: 'Achievement Badge' }
      ]
    });
    
    if (!template) {
      console.log('❌ Achievement Badge template not found');
      return;
    }

    console.log('Found template:', {
      id: template._id,
      name: template.name,
      description: template.description
    });

    // Update the template with Spanish text
    const updateResult = await Template.updateOne(
      { _id: template._id },
      {
        $set: {
          name: 'Insignia de Logro',
          description: 'Insignia moderna para premios y logros'
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Achievement Badge template updated successfully with Spanish text');
      
      // Verify the update
      const updatedTemplate = await Template.findById(template._id);
      console.log('Updated template:', {
        name: updatedTemplate.name,
        description: updatedTemplate.description
      });
    } else {
      console.log('⚠️ No changes made to the template');
    }

  } catch (error) {
    console.error('❌ Error updating Achievement Badge template:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update
updateAchievementBadgeSpanish();
