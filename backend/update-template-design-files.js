const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Template = require('./models/Template');

async function updateTemplateDesignFiles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/reddragon');
    console.log('📊 Connected to database');

    // Get all templates
    const templates = await Template.find({});
    console.log(`📋 Found ${templates.length} templates`);

    // Get all design files
    const designsDir = path.join(__dirname, 'uploads', 'designs');
    if (!fs.existsSync(designsDir)) {
      console.log('❌ Designs directory does not exist');
      return;
    }

    const designFiles = fs.readdirSync(designsDir).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${designFiles.length} design files`);

    let updatedCount = 0;

    for (const template of templates) {
      // Look for design file that matches template ID
      const designFilename = `${template._id}.json`;
      const designFilePath = path.join(designsDir, designFilename);
      
      if (fs.existsSync(designFilePath)) {
        try {
          // Update template with designFilename
          await Template.findByIdAndUpdate(template._id, {
            designFilename: designFilename,
            updatedAt: new Date()
          });

          console.log(`✅ Updated ${template.name} (ID: ${template._id}) with designFilename: ${designFilename}`);
          updatedCount++;
        } catch (error) {
          console.log(`❌ Failed to update ${template.name}: ${error.message}`);
        }
      } else {
        console.log(`⚠️  No design file found for ${template.name} (ID: ${template._id})`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} templates with design filenames`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from database');
  }
}

updateTemplateDesignFiles();
