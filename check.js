const fs = require('fs')
const content = fs.readFileSync('app/dual-control/[dualSessionId]/peca.tsx', 'utf8')
const lines = content.split('\n')
console.log(JSON.stringify(lines[80]))
