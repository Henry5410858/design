const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
require('./models/Template.js');

console.log('🧹 CLEANUP: Orphaned Design Files\n');
console.log('====================================\n');

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

// Clean up orphaned design files
const cleanupOrphanedFiles = async () => {
  try {
    console.log('🔍 ANALYZING DESIGN FILES AND DATABASE:\n');
    
    // Get the Template model
    const Template = mongoose.model('Template');
    
    // Get all templates with their designFilename
    const templates = await Template.find({ designFilename: { $exists: true, $ne: '' } });
    console.log(`📊 Templates with designFilename: ${templates.length}`);
    
    const referencedFiles = new Set();
    templates.forEach(template => {
      if (template.designFilename) {
        referencedFiles.add(template.designFilename);
        console.log(`   📋 ${template.name} -> ${template.designFilename}`);
      }
    });
    
    console.log(`\n📁 Checking uploads/designs directory...`);
    const designsDir = path.resolve(__dirname, 'uploads/designs');
    
    if (!fs.existsSync(designsDir)) {
      console.log('❌ Designs directory does not exist');
      return;
    }
    
    const designFiles = fs.readdirSync(designsDir).filter(file => file.endsWith('.json'));
    console.log(`📄 Total design files found: ${designFiles.length}`);
    
    // Find orphaned files
    const orphanedFiles = designFiles.filter(file => !referencedFiles.has(file));
    
    console.log(`\n🗑️ ORPHANED FILES TO CLEANUP: ${orphanedFiles.length}`);
    
    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned files found!');
      return;
    }
    
    orphanedFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    // Clean up orphaned files
    console.log(`\n🧹 CLEANING UP ORPHANED FILES...`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(designsDir, file);
        const fileSize = fs.statSync(filePath).size;
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        
        console.log(`\n🗑️ Deleting: ${file} (${fileSizeMB} MB)`);
        
        fs.unlinkSync(filePath);
        console.log(`   ✅ Deleted successfully`);
        deletedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error deleting ${file}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`   ✅ Files deleted: ${deletedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Remaining files: ${designFiles.length - deletedCount}`);
    
    if (deletedCount > 0) {
      console.log(`\n🎉 Cleanup completed successfully!`);
      console.log(`   Freed up space by removing ${deletedCount} orphaned files.`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Run the cleanup
const runCleanup = async () => {
  await connectDB();
  await cleanupOrphanedFiles();
  await mongoose.disconnect();
  console.log('\n🔍 Cleanup script completed');
};

runCleanup();
