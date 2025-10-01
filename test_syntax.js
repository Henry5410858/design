// Extract just the problematic section to test syntax
const fs = require('fs');

const content = fs.readFileSync('e:\\work\\design_center\\centro-diseno-final\\backend\\services\\pdfRenderer.js', 'utf8');
const lines = content.split('\n');

// Extract lines around the error (450-470)
const problemSection = lines.slice(449, 470).join('\n');
console.log('Lines 450-470:');
console.log(problemSection);

// Check what comes before line 457
console.log('\n=== Line 456 ===');
console.log(lines[455]);
console.log('\n=== Line 457 ===');
console.log(lines[456]);
console.log('\n=== Line 458 ===');
console.log(lines[457]);