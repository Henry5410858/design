const fs = require('fs');

const content = fs.readFileSync('e:\\work\\design_center\\centro-diseno-final\\backend\\services\\pdfRenderer.js', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let inString = false;
let inComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j-1] : '';
    
    // Skip strings and comments (simplified)
    if (char === '"' || char === "'" || char === '`') {
      if (!inComment) inString = !inString;
    }
    if (char === '/' && line[j+1] === '/') {
      inComment = true;
    }
    
    if (!inString && !inComment) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount < 0) {
          console.log(`Extra closing brace at line ${i + 1}: ${line.trim()}`);
        }
      }
    }
    
    if (char === '\n') inComment = false;
  }
  
  // Check specific problematic lines
  if (i + 1 >= 455 && i + 1 <= 460) {
    console.log(`Line ${i + 1} (brace count: ${braceCount}): ${line.trim()}`);
  }
}

console.log(`Final brace count: ${braceCount}`);