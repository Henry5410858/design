const mongoose = require('mongoose');
const request = require('supertest');
require('dotenv').config();

// Test plan restrictions for template operations
async function testPlanRestrictions() {
  try {
    console.log('🧪 Testing plan restrictions for template operations...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('✅ Connected to MongoDB');

    // Test data
    const testTemplate = {
      name: 'Test Template',
      type: 'square-post',
      category: 'social-posts',
      objects: [
        {
          id: 'text-1',
          type: 'text',
          x: 50,
          y: 50,
          width: 400,
          height: 60,
          text: 'Test Text',
          fontSize: 32,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#000000'
        }
      ],
      dimensions: { width: 1080, height: 1080 }
    };

    // Test 1: Free plan user attempting to create template
    console.log('1️⃣ Testing Free plan user creating template:');
    try {
      const freeUserResponse = await fetch('http://localhost:3000/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testTemplate,
          userId: 'user1' // This is a free plan user
        })
      });
      
      const freeUserResult = await freeUserResponse.json();
      console.log(`   Status: ${freeUserResponse.status}`);
      console.log(`   Response:`, freeUserResult);
      
      if (freeUserResponse.status === 403) {
        console.log('   ✅ Free plan restriction working correctly');
      } else {
        console.log('   ❌ Free plan restriction not working');
      }
    } catch (error) {
      console.log('   ⚠️ Error testing free plan:', error.message);
    }

    // Test 2: Premium plan user creating template
    console.log('\n2️⃣ Testing Premium plan user creating template:');
    try {
      const premiumUserResponse = await fetch('http://localhost:3000/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testTemplate,
          userId: 'user2' // This is a premium plan user
        })
      });
      
      const premiumUserResult = await premiumUserResponse.json();
      console.log(`   Status: ${premiumUserResponse.status}`);
      console.log(`   Response:`, premiumUserResult);
      
      if (premiumUserResponse.status === 201) {
        console.log('   ✅ Premium plan user can create templates');
      } else {
        console.log('   ❌ Premium plan user cannot create templates');
      }
    } catch (error) {
      console.log('   ⚠️ Error testing premium plan:', error.message);
    }

    // Test 3: Check user plan API
    console.log('\n3️⃣ Testing user plan API:');
    try {
      const freeUserPlanResponse = await fetch('http://localhost:3000/api/user/plan?userId=user1');
      const freeUserPlanData = await freeUserPlanResponse.json();
      console.log(`   Free user plan: ${freeUserPlanData.plan}`);
      
      const premiumUserPlanResponse = await fetch('http://localhost:3000/api/user/plan?userId=user2');
      const premiumUserPlanData = await premiumUserPlanResponse.json();
      console.log(`   Premium user plan: ${premiumUserPlanData.plan}`);
      
      if (freeUserPlanData.plan === 'Gratis' && premiumUserPlanData.plan === 'Premium') {
        console.log('   ✅ User plan API working correctly');
      } else {
        console.log('   ❌ User plan API not working correctly');
      }
    } catch (error) {
      console.log('   ⚠️ Error testing user plan API:', error.message);
    }

  } catch (error) {
    console.error('❌ Error testing plan restrictions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testPlanRestrictions();
