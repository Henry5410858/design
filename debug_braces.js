const fs = require('fs');

const content = fs.readFileSync('e:\\work\\design_center\\centro-diseno-final\\backend\\services\\pdfRenderer.js', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Count braces, parens, and brackets
  for (let char of line) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (char === '[') bracketCount++;
    if (char === ']') bracketCount--;
  }
  
  // Check for try/catch patterns
  if (line.trim().includes('try {') || line.trim().includes('} catch')) {
    console.log(`Line ${lineNum}: ${line.trim()} | Braces: ${braceCount}, Parens: ${parenCount}, Brackets: ${bracketCount}`);
  }
  
  // Report negative counts (indicates mismatch)
  if (braceCount < 0 || parenCount < 0 || bracketCount < 0) {
    console.log(`MISMATCH at line ${lineNum}: ${line.trim()} | Braces: ${braceCount}, Parens: ${parenCount}, Brackets: ${bracketCount}`);
  }
}

console.log(`Final counts - Braces: ${braceCount}, Parens: ${parenCount}, Brackets: ${bracketCount}`);