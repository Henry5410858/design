const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUG: Why Old Design File is NOT Being Deleted\n');
console.log('==================================================\n');

// This script tests the exact cleanup logic from the backend

const debugCleanupIssue = () => {
  console.log('📋 ANALYZING THE CLEANUP ISSUE:\n');
  
  // Setup test environment
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const designsDir = path.resolve(__dirname, '../uploads/designs');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(designsDir)) {
    fs.mkdirSync(designsDir, { recursive: true });
  }
  
  console.log('✅ Test environment ready\n');
  
  // ========================================
  // STEP 1: Create a test template scenario
  // ========================================
  console.log('🌅 STEP 1: Create Test Template Scenario\n');
  
  // Simulate the exact scenario from the user
  const oldDesignFilename = 'design-1756642384257-134452628.json';
  const oldDesignPath = path.join(designsDir, oldDesignFilename);
  const oldDesignContent = {
    templateId: 'template-123',
    designData: 'This is the OLD design that should be deleted',
    timestamp: Date.now()
  };
  
  // Create the old design file
  fs.writeFileSync(oldDesignPath, JSON.stringify(oldDesignContent, null, 2));
  
  console.log('📄 OLD DESIGN FILE CREATED:');
  console.log(`   Filename: ${oldDesignFilename}`);
  console.log(`   Path: ${oldDesignPath}`);
  console.log(`   Content: ${oldDesignContent.designData}`);
  
  // Verify file exists
  if (fs.existsSync(oldDesignPath)) {
    console.log('   ✅ File exists and is accessible');
  }
  
  console.log('');
  
  // ========================================
  // STEP 2: Simulate Frontend Request
  // ========================================
  console.log('🌐 STEP 2: Simulate Frontend Request\n');
  
  // This is what the frontend sends to PUT /api/templates/:id
  const frontendRequest = {
    body: {
      designFilename: 'new-design-456.json', // New design filename
      name: 'Updated Template',
      // ... other fields
    },
    params: {
      id: 'template-123'
    }
  };
  
  console.log('📤 FRONTEND REQUEST:');
  console.log('   Method: PUT /api/templates/:id');
  console.log(`   Template ID: ${frontendRequest.params.id}`);
  console.log(`   New designFilename: ${frontendRequest.body.designFilename}`);
  console.log(`   Request body:`, frontendRequest.body);
  
  console.log('');
  
  // ========================================
  // STEP 3: Test Backend Cleanup Logic
  // ========================================
  console.log('⚙️ STEP 3: Test Backend Cleanup Logic\n');
  
  // This is the EXACT logic from the backend PUT route
  const testBackendCleanup = () => {
    console.log('🔍 BACKEND LOGIC EXECUTION:\n');
    
    // Step 1: Extract data from request
    const { id } = frontendRequest.params;
    const { designFilename } = frontendRequest.body;
    
    console.log('📋 Step 1: Extract Request Data');
    console.log(`   Template ID: ${id}`);
    console.log(`   New designFilename: ${designFilename}`);
    
    // Step 2: Check if we're updating design
    const isUpdatingDesign = designFilename && designFilename !== '';
    console.log('');
    console.log('📋 Step 2: Check Design Update');
    console.log(`   Condition: designFilename && designFilename !== ""`);
    console.log(`   designFilename: "${designFilename}"`);
    console.log(`   designFilename !== "": ${designFilename !== ""}`);
    console.log(`   Result: ${isUpdatingDesign}`);
    
    if (isUpdatingDesign) {
      console.log('✅ Design update detected - cleanup should happen');
      
      // Step 3: Simulate deleteOldDesignFile function
      console.log('');
      console.log('📋 Step 3: Execute deleteOldDesignFile Function');
      
      // This is the EXACT logic from deleteOldDesignFile
      const deleteOldDesignFile = async (templateId) => {
        try {
          console.log(`   🔍 Finding template with ID: ${templateId}`);
          
          // Simulate finding template in database
          const mockTemplate = {
            _id: templateId,
            designFilename: oldDesignFilename, // This is the OLD filename
            name: 'Test Template'
          };
          
          console.log(`   📄 Template found:`, mockTemplate);
          console.log(`   📄 Old designFilename: ${mockTemplate.designFilename}`);
          
          if (mockTemplate && mockTemplate.designFilename) {
            const oldFilePath = path.resolve(__dirname, '../uploads/designs', mockTemplate.designFilename);
            console.log(`   🗂️ Old file path: ${oldFilePath}`);
            
            // Check if file exists
            if (fs.existsSync(oldFilePath)) {
              console.log('   ✅ Old file exists - proceeding with deletion');
              
              // Delete the file
              fs.unlinkSync(oldFilePath);
              console.log('   🗑️ OLD DESIGN FILE DELETED SUCCESSFULLY');
              return true;
            } else {
              console.log('   ❌ Old file does not exist');
              return false;
            }
          } else {
            console.log('   ❌ Template has no designFilename');
            return false;
          }
        } catch (error) {
          console.error('   ❌ Error in deleteOldDesignFile:', error);
          return false;
        }
      };
      
      // Execute the cleanup
      deleteOldDesignFile(id).then(result => {
        console.log(`   📊 Cleanup result: ${result}`);
      });
      
    } else {
      console.log('❌ Design update NOT detected - cleanup will NOT happen');
      console.log('   This explains why the old file is not being deleted!');
    }
  };
  
  // Run the test
  testBackendCleanup();
  
  console.log('');
  
  // ========================================
  // STEP 4: Verify Results
  // ========================================
  console.log('✅ STEP 4: Verify Results\n');
  
  // Wait a moment for async operations
  setTimeout(() => {
    const oldFileExists = fs.existsSync(oldDesignPath);
    
    console.log('📊 CLEANUP RESULTS:');
    console.log(`   Old design file exists: ${oldFileExists ? '❌ YES (CLEANUP FAILED)' : '✅ NO (CLEANUP SUCCESS)'}`);
    
    if (!oldFileExists) {
      console.log('\n🎉 SUCCESS: Old design file was deleted!');
    } else {
      console.log('\n❌ FAILURE: Old design file still exists!');
      console.log('   This means the cleanup logic is not working as expected.');
    }
    
    // Final cleanup
    console.log('\n🧹 Cleaning up test files...');
    if (fs.existsSync(oldDesignPath)) {
      fs.unlinkSync(oldDesignPath);
      console.log('   ✅ Removed test old design file');
    }
    
    console.log('\n🔍 DIAGNOSIS COMPLETE!');
    console.log('Check the logs above to see exactly what happened.');
  }, 1000);
};

// Run the debug
debugCleanupIssue();
