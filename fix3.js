const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')
const lines = content.split('\n')
const line = lines[80]
console.log('Chars:')
for(let i=0; i<line.length; i++) {
  console.log(i, line.charCodeAt(i), JSON.stringify(line[i]))
}
