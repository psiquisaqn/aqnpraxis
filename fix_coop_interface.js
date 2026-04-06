const fs = require('fs')
let coop = fs.readFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', 'utf8')

coop = coop.replace(
  `  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: CooperResponse) => void
}`,
  `  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: CooperResponse) => void
  displayReady?: boolean
}`
)

fs.writeFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', coop, 'utf8')
console.log('Done:', coop.includes('displayReady?: boolean'))
