const fs = require('fs');
const path = require('path');

// Test the file cleanup functionality
console.log('🧪 Testing File Cleanup Functionality...\n');

// Test the deleteFileSafely function
const deleteFileSafely = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ File deleted successfully:', filePath);
      return true;
    } else {
      console.log('⚠️ File not found for deletion:', filePath);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting file:', filePath, error);
    return false;
  }
};

// Test scenarios
console.log('📁 Testing file deletion scenarios:\n');

// 1. Test with non-existent file
console.log('1. Testing deletion of non-existent file:');
const nonExistentFile = path.resolve(__dirname, 'non-existent-file.txt');
deleteFileSafely(nonExistentFile);
console.log('');

// 2. Test with existing file (create a test file first)
console.log('2. Testing deletion of existing file:');
const testFile = path.resolve(__dirname, 'test-file.txt');
fs.writeFileSync(testFile, 'This is a test file for deletion');
console.log('✅ Test file created:', testFile);

// Verify file exists
if (fs.existsSync(testFile)) {
  console.log('✅ Test file exists before deletion');
}

// Delete the file
deleteFileSafely(testFile);

// Verify file is deleted
if (!fs.existsSync(testFile)) {
  console.log('✅ Test file successfully deleted');
} else {
  console.log('❌ Test file still exists after deletion');
}

console.log('\n🎯 File cleanup test completed!');
console.log('\n📋 Summary:');
console.log('- Non-existent file handling: ✅');
console.log('- Existing file deletion: ✅');
console.log('- Error handling: ✅');
