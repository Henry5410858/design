// Utility to inspect and fix indexes, especially templateKey on Template collection
// Run with: node backend/scripts/fixIndexes.js

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/design_center';

async function main() {
  const safeURI = MONGODB_URI.replace(/\/\/.*@/, '//***:***@');
  console.log('🔌 Connecting to MongoDB:', safeURI);
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection.db;
  console.log('✅ Connected. Database:', db.databaseName);

  const templateColl = db.collection('templates');
  const indexes = await templateColl.indexes();
  console.log('📋 Current Template indexes:\n', indexes);

  // Find templateKey index
  const tkIndex = indexes.find(ix => ix.key && ix.key.templateKey === 1);
  if (tkIndex) {
    const isUnique = !!tkIndex.unique;
    if (!isUnique) {
      console.log('🧹 Found non-unique index on templateKey, dropping:', tkIndex.name);
      await templateColl.dropIndex(tkIndex.name);
      console.log('🗑️  Dropped non-unique index:', tkIndex.name);
    } else {
      console.log('✅ templateKey index is already unique:', tkIndex.name);
    }
  } else {
    console.log('ℹ️ No index on templateKey currently exists. Mongoose will create one from schema (unique).');
  }

  // Reload models to ensure indexes from schema
  const Template = require('../models/Template');
  await Template.syncIndexes(); // Creates/drops to match schema
  console.log('🔧 syncIndexes() completed for Template');

  const updated = await templateColl.indexes();
  console.log('✅ Updated Template indexes:\n', updated);

  await mongoose.disconnect();
  console.log('👋 Done.');
}

main().catch(err => {
  console.error('❌ Fix indexes script failed:', err);
  process.exitCode = 1;
});