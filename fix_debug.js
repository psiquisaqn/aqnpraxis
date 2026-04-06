const fs = require('fs')
let page = fs.readFileSync('app/dual-control/[dualSessionId]/page.tsx', 'utf8')

page = page.replace(
  `    if (payload.type === 'display_ready') {
      console.log('Display listo')
      setDisplayReady(true)
    }`,
  `    if (payload.type === 'display_ready') {
      console.log('=== DISPLAY READY RECIBIDO ===', payload)
      setDisplayReady(prev => {
        console.log('displayReady anterior:', prev, '-> true')
        return true
      })
    }`
)

fs.writeFileSync('app/dual-control/[dualSessionId]/page.tsx', page, 'utf8')
console.log('OK')
