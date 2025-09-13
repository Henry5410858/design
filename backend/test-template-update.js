const mongoose = require('mongoose');
const Template = require('./models/Template');

async function testUpdate() {
  try {
    await mongoose.connect('mongodb://localhost:27017/reddragon');
    console.log('📊 Connected to database');

    // Test with one specific template
    const templateId = '68bad037fb4a121ba01d59d1';
    const result = await Template.findByIdAndUpdate(
      templateId, 
      { designFilename: '68bad037fb4a121ba01d59d1.json' },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ Updated template: ${result.name}`);
      console.log(`   designFilename: ${result.designFilename}`);
    } else {
      console.log('❌ Template not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from database');
  }
}

testUpdate();
