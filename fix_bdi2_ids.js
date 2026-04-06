const fs = require('fs')
let bdi2 = fs.readFileSync('app/dual-control/[dualSessionId]/bdi2.tsx', 'utf8')

// BDI2_ITEMS usa num no id
bdi2 = bdi2.replace(/item\.id/g, 'item.num')
bdi2 = bdi2.replace(/\.find\(item => item\.id === /g, '.find(item => item.num === ')
bdi2 = bdi2.replace(/\.find\(i => i\.id === /g, '.find(i => i.num === ')

// El tipo de opciones - verificar estructura
fs.writeFileSync('app/dual-control/[dualSessionId]/bdi2.tsx', bdi2, 'utf8')
console.log('OK')
