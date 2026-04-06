const fs = require('fs')
let coop = fs.readFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', 'utf8')

coop = coop.replace(
  '  onSaveResponse: (item: number, value: CooperResponse) => void\r\n}',
  '  onSaveResponse: (item: number, value: CooperResponse) => void\r\n  displayReady?: boolean\r\n}'
)

fs.writeFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', coop, 'utf8')
console.log('Done:', coop.includes('displayReady?: boolean'))
