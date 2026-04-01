const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// Agregar room_code al header
const oldHeader = `              <p className="text-xs text-gray-400 mt-1">Test: {testLabel}</p>`
const newHeader = `              <p className="text-xs text-gray-400 mt-1">Test: {testLabel}</p>
              <p className="text-xs text-gray-400 mt-1">
                Codigo de sala: <span className="font-mono font-bold text-blue-600 text-sm">{sessionData?.room_code}</span>
              </p>`

content = content.replace(oldHeader, newHeader)
fs.writeFileSync(path, content, 'utf8')
console.log('Done')
