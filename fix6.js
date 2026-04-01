const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')
const lines = content.split('\n')

// Fix line 81 (index 80) - progress bar width
lines[80] = '          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: ((completed/45)*100) + "%" }} />'

// Find and fix other broken template literals
for(let i=0; i<lines.length; i++) {
  if(lines[i].includes('+""+')) {
    console.log('Found broken template at line', i+1, ':', lines[i].trim())
  }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8')
console.log('Done')
