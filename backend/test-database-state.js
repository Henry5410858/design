const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Template.js');

console.log('🔍 DEBUG: Database State Check\n');
console.log('================================\n');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/designcenter');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Check database state
const checkDatabaseState = async () => {
  try {
    console.log('📊 CHECKING DATABASE STATE:\n');
    
    // Get the Template model
    const Template = mongoose.model('Template');
    
    // Check all templates
    console.log('🔍 ALL TEMPLATES IN DATABASE:');
    const allTemplates = await Template.find({});
    console.log(`   Total templates: ${allTemplates.length}`);
    
    allTemplates.forEach((template, index) => {
      console.log(`\n   📄 Template ${index + 1}:`);
      console.log(`      ID: ${template._id}`);
      console.log(`      Name: ${template.name}`);
      console.log(`      Template Key: ${template.templateKey}`);
      console.log(`      Type: ${template.type}`);
      console.log(`      Design Filename: ${template.designFilename || 'NONE'}`);
      console.log(`      Background Color: ${template.backgroundColor}`);
      console.log(`      Background Image: ${template.backgroundImage || 'NONE'}`);
      console.log(`      Created: ${template.createdAt}`);
      console.log(`      Updated: ${template.updatedAt}`);
    });
    
    // Check for templates with the specific old filename
    console.log('\n🔍 LOOKING FOR TEMPLATE WITH OLD FILENAME:');
    const oldFilename = 'design-1756642384257-134452628.json';
    const templatesWithOldFile = await Template.find({ designFilename: oldFilename });
    
    if (templatesWithOldFile.length > 0) {
      console.log(`   ✅ Found ${templatesWithOldFile.length} template(s) with old filename:`);
      templatesWithOldFile.forEach(template => {
        console.log(`      - Template: ${template.name} (${template._id})`);
        console.log(`      - Template Key: ${template.templateKey}`);
        console.log(`      - Design Filename: ${template.designFilename}`);
      });
    } else {
      console.log(`   ❌ NO templates found with old filename: ${oldFilename}`);
      console.log('   This explains why cleanup is not working!');
    }
    
    // Check for templates with any designFilename
    console.log('\n🔍 TEMPLATES WITH DESIGN FILENAMES:');
    const templatesWithDesignFile = await Template.find({ designFilename: { $exists: true, $ne: null } });
    
    if (templatesWithDesignFile.length > 0) {
      console.log(`   ✅ Found ${templatesWithDesignFile.length} template(s) with design files:`);
      templatesWithDesignFile.forEach(template => {
        console.log(`      - Template: ${template.name} (${template._id})`);
        console.log(`      - Template Key: ${template.templateKey}`);
        console.log(`      - Design Filename: ${template.designFilename}`);
      });
    } else {
      console.log('   ❌ NO templates found with design files');
    }
    
    // Check for templates with templateKey
    console.log('\n🔍 TEMPLATES WITH TEMPLATE KEYS:');
    const templatesWithKey = await Template.find({ templateKey: { $exists: true, $ne: null } });
    
    if (templatesWithKey.length > 0) {
      console.log(`   ✅ Found ${templatesWithKey.length} template(s) with template keys:`);
      templatesWithKey.forEach(template => {
        console.log(`      - Template: ${template.name} (${template._id})`);
        console.log(`      - Template Key: ${template.templateKey}`);
        console.log(`      - Design Filename: ${template.designFilename || 'NONE'}`);
      });
    } else {
      console.log('   ❌ NO templates found with template keys');
    }
    
    // Check file system
    console.log('\n🔍 CHECKING FILE SYSTEM:');
    const fs = require('fs');
    const path = require('path');
    
         const designsDir = path.resolve(__dirname, 'uploads/designs');
    if (fs.existsSync(designsDir)) {
      const files = fs.readdirSync(designsDir);
      console.log(`   📁 Designs directory: ${designsDir}`);
      console.log(`   📄 Files found: ${files.length}`);
      
      if (files.length > 0) {
        console.log('   📋 File list:');
        files.forEach(file => {
          const filePath = path.join(designsDir, file);
          const stats = fs.statSync(filePath);
          console.log(`      - ${file} (${stats.size} bytes, ${stats.mtime})`);
        });
      }
    } else {
      console.log('   ❌ Designs directory does not exist');
    }
    
    console.log('\n🔍 DIAGNOSIS SUMMARY:');
    console.log('=====================================');
    
    if (templatesWithOldFile.length === 0) {
      console.log('❌ PROBLEM IDENTIFIED:');
      console.log('   The old file "design-1756642384257-134452628.json" is NOT');
      console.log('   associated with any template in the database.');
      console.log('');
      console.log('🔧 WHY CLEANUP ISN\'T WORKING:');
      console.log('   1. The old file exists in the file system');
      console.log('   2. But no template in the database references it');
      console.log('   3. So when cleanup runs, it can\'t find the template');
      console.log('   4. Therefore, the old file is never deleted');
      console.log('');
      console.log('💡 POSSIBLE CAUSES:');
      console.log('   1. Template was deleted from database but file remained');
      console.log('   2. Template was updated without proper cleanup');
      console.log('   3. Database corruption or sync issues');
      console.log('   4. Manual file manipulation');
    } else {
      console.log('✅ TEMPLATE FOUND:');
      console.log('   The old file IS associated with a template.');
      console.log('   Cleanup should be working. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Error checking database state:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await checkDatabaseState();
  } catch (error) {
    console.error('❌ Main execution error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
};

main();
