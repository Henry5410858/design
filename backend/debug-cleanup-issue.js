const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Template.js');

console.log('🔍 DEBUG: Cleanup System Test\n');
console.log('=====================================\n');

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

// Test the cleanup logic safely (without deleting real files)
const testCleanupLogic = async () => {
  try {
    console.log('📋 TESTING CLEANUP LOGIC SAFELY:\n');
    
    // Get the Template model
    const Template = mongoose.model('Template');
    
    // Show ALL templates first
    console.log('🔍 ALL TEMPLATES IN DATABASE:\n');
    const allTemplates = await Template.find({});
    console.log(`📊 Total templates found: ${allTemplates.length}\n`);
    
    allTemplates.forEach((template, index) => {
      console.log(`📋 Template ${index + 1}:`);
      console.log(`   ID: ${template._id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Template Key: ${template.templateKey}`);
      console.log(`   Type: ${template.type}`);
      console.log(`   designFilename: ${template.designFilename || 'NOT SET'}`);
      console.log(`   Has designFilename: ${!!template.designFilename}`);
      console.log('');
    });
    
    // Find a template with designFilename
    const template = await Template.findOne({ designFilename: { $exists: true, $ne: '' } });
    
    if (!template) {
      console.log('❌ No template found with designFilename');
      console.log('\n🔍 This explains why cleanup is not working!');
      console.log('   The templates in the database do not have designFilename set.');
      console.log('   This means when the frontend saves, the database is not being updated correctly.');
      return;
    }
    
    console.log('🔍 Found template:');
    console.log('   ID:', template._id);
    console.log('   Template Key:', template.templateKey);
    console.log('   Current designFilename:', template.designFilename);
    console.log('   Type:', template.type);
    console.log('');
    
    // Test the cleanup logic SAFELY (without deleting real files)
    console.log('🧪 TESTING CLEANUP LOGIC SAFELY:\n');
    
    // Simulate the request body
    const reqBody = {
      designFilename: 'test-new-design.json',
      backgroundColor: '#ffffff',
      backgroundImage: null,
      canvasSize: { width: 800, height: 600 },
      updatedAt: new Date().toISOString()
    };
    
    console.log('📤 Request body:', reqBody);
    
    // Check if we're updating the designFilename
    const isUpdatingDesign = reqBody.designFilename && reqBody.designFilename !== '';
    console.log('🔍 isUpdatingDesign:', isUpdatingDesign);
    
    if (isUpdatingDesign) {
      console.log('🔄 Would update design file for template:', template._id);
      
      // SAFELY test the deleteOldDesignFile function (read-only)
      const oldFileExists = await checkOldFileExists(template._id);
      console.log('🔍 Old file exists check:', oldFileExists);
      
      if (oldFileExists) {
        console.log('✅ Old design file exists and would be cleaned up');
        console.log('   (In real operation, this file would be deleted)');
      } else {
        console.log('❌ Old design file does not exist');
        console.log('   (This would cause cleanup to fail)');
      }
    }
    
    // Test the actual backend route logic
    console.log('\n🧪 TESTING BACKEND ROUTE LOGIC:\n');
    
    // Check if the template update would work
    const updateResult = await testTemplateUpdate(template._id, reqBody);
    console.log('📊 Template update test result:', updateResult);
    
  } catch (error) {
    console.error('❌ Error testing cleanup logic:', error);
  }
};

// SAFELY check if old file exists (read-only)
const checkOldFileExists = async (templateId) => {
  try {
    const Template = mongoose.model('Template');
    const template = await Template.findById(templateId);
    if (template && template.designFilename) {
      const oldFilePath = require('path').resolve(__dirname, 'uploads/designs', template.designFilename);
      console.log('🔍 Old file path:', oldFilePath);
      
      // Check if file exists (read-only)
      const fs = require('fs');
      const exists = fs.existsSync(oldFilePath);
      console.log('📁 File exists:', exists);
      
      if (exists) {
        const stats = fs.statSync(oldFilePath);
        console.log('📊 File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('📅 Last modified:', stats.mtime);
      }
      
      return exists;
    }
    return false;
  } catch (error) {
    console.error('❌ Error checking file existence:', error);
    return false;
  }
};

// Test template update without actually updating
const testTemplateUpdate = async (templateId, updateData) => {
  try {
    const Template = mongoose.model('Template');
    
    // Check if template exists
    const template = await Template.findById(templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    
    // Validate update data
    const isValidUpdate = updateData.designFilename && updateData.designFilename !== '';
    
    return {
      success: true,
      templateId: templateId,
      currentDesignFilename: template.designFilename,
      newDesignFilename: updateData.designFilename,
      isValidUpdate: isValidUpdate,
      wouldTriggerCleanup: isValidUpdate && template.designFilename !== updateData.designFilename
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testCleanupLogic();
  await mongoose.disconnect();
  console.log('\n🔍 Test completed safely');
};

runTest();
