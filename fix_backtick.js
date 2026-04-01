const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')

// Fix: +""+"`${expr}%"+""+ -> `${expr}%`
content = content.replace(/\+""\+""\$\{([^}]+)\}%""\+""\+/g, '`${$1}%`')

// Fix other template literals with same pattern
content = content.replace(/\+""\+""\$\{([^}]+)\}""\+""\+/g, '`${$1}`')

fs.writeFileSync(path, content, 'utf8')
console.log('Done')
