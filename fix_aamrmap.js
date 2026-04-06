const fs = require('fs')
let peca = fs.readFileSync('app/dual-control/[dualSessionId]/peca.tsx', 'utf8')

peca = peca.replace(
  "      const aamrMap: Record<string, number> = {}",
  "      const aamrMap: Record<string, any> = {}"
)

fs.writeFileSync('app/dual-control/[dualSessionId]/peca.tsx', peca, 'utf8')
console.log('OK:', peca.includes('Record<string, any>'))
