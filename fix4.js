const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')

// Pattern: +""+"`${EXPR}%"+""+ -> `${EXPR}%`
// Chars: + " " + " ` $ { ... } % " + " " +
content = content.replace(/\+""\+"(`.+?`)""\+""\+/g, '$1')
content = content.replace(/\+""\+"(`[^`]*`)""\+""\+/g, '$1')

// More specific: replace the exact broken pattern
const broken1 = '+""+""`${(completed/45)*100}%""+""+'
const fixed1 = '`${(completed/45)*100}%`'
content = content.split(broken1).join(fixed1)

fs.writeFileSync(path, content, 'utf8')

// Verify
const lines = fs.readFileSync(path, 'utf8').split('\n')
console.log('Line 81:', lines[80])
