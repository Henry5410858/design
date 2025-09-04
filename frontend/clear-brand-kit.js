// Script to clear corrupted Brand Kit data from localStorage
// Run this in the browser console to fix the logo issue

console.log('🧹 Clearing corrupted Brand Kit data...');

// Clear the corrupted brand kit data
localStorage.removeItem('brandKit');

console.log('✅ Brand Kit data cleared successfully!');
console.log('📝 Next steps:');
console.log('1. Go to the Brand Kit page (/brand-kit)');
console.log('2. Upload a fresh logo (PNG or SVG)');
console.log('3. Return to the editor - your logo should now appear correctly');

// Verify the data is cleared
const remainingData = localStorage.getItem('brandKit');
if (remainingData === null) {
  console.log('✅ Confirmed: Brand Kit data has been completely removed');
} else {
  console.log('⚠️ Warning: Some data still remains:', remainingData);
}
