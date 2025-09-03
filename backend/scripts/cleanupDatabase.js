const mongoose = require('mongoose');
const Template = require('../models/Template');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/designcenter', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const cleanupDatabase = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Remove unwanted templates
    const templatesToRemove = [
      'Modern Family',
      'Summer Sale Flyer'
    ];
    
    for (const templateName of templatesToRemove) {
      const result = await Template.deleteOne({ name: templateName });
      if (result.deletedCount > 0) {
        console.log(`✅ Removed template: ${templateName}`);
      } else {
        console.log(`ℹ️ Template not found: ${templateName}`);
      }
    }
    
    // Verify current templates
    const remainingTemplates = await Template.find({});
    console.log('\n📋 Current templates in database:');
    remainingTemplates.forEach(template => {
      console.log(`- ${template.name} (${template.type})`);
    });
    
    console.log(`\n✨ Database cleanup completed! Total templates: ${remainingTemplates.length}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
};

cleanupDatabase();
