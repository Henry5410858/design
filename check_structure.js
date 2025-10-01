const fs = require('fs');

const content = fs.readFileSync('e:\\work\\design_center\\centro-diseno-final\\backend\\services\\pdfRenderer.js', 'utf8');
const lines = content.split('\n');

// Find all try and catch statements with their line numbers
console.log('=== TRY/CATCH STRUCTURE ===');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const lineNum = i + 1;
  
  if (line.includes('try {') && !line.includes('//')) {
    console.log(`${lineNum}: TRY - ${line}`);
  }
  if (line.includes('} catch') && !line.includes('//')) {
    console.log(`${lineNum}: CATCH - ${line}`);
  }
}

// Check the specific problematic area
console.log('\n=== LINES 590-600 ===');
for (let i = 589; i < 600 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}