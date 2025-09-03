const mongoose = require('mongoose');
const User = require('./models/User');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/designcenter';

async function migrateRoleToPlan() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database');

    // Find all users with role field
    const usersWithRole = await User.find({ role: { $exists: true } });
    console.log(`Found ${usersWithRole.length} users with role field`);

    if (usersWithRole.length === 0) {
      console.log('No users with role field found. Migration not needed.');
      return;
    }

    // Update each user: copy role to plan and remove role
    for (const user of usersWithRole) {
      console.log(`Migrating user: ${user.email} (${user.role} -> ${user.plan})`);
      
      // Update the user document
      await User.findByIdAndUpdate(user._id, {
        $set: { plan: user.role },
        $unset: { role: 1 }
      });
    }

    console.log('Migration completed successfully!');
    console.log(`Updated ${usersWithRole.length} users`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateRoleToPlan();
}

module.exports = migrateRoleToPlan;
