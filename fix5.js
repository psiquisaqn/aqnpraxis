const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')

const backtick = String.fromCharCode(96)
const broken = '+""+' + backtick + '${(completed/45)*100}%' + '""+""+'
const fixed = backtick + '${(completed/45)*100}%' + backtick

content = content.split(broken).join(fixed)
console.log('Fixed:', content.includes(fixed))

fs.writeFileSync(path, content, 'utf8')
const lines = fs.readFileSync(path, 'utf8').split('\n')
console.log('Line 81:', lines[80])
