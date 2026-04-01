const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/page.tsx'
let content = fs.readFileSync(path, 'utf8')

const oldRealtime = `  const { sendMessage } = useRealtime(dualSessionId, (payload) => {
    console.log('Mensaje recibido en control:', payload)
  })`

const newRealtime = `  const { sendMessage } = useRealtime(dualSessionId, (payload) => {
    console.log('Mensaje recibido en control:', payload)
    if (payload.type === 'display_ready') {
      console.log('Display listo, disparando evento...')
      window.dispatchEvent(new Event('display_ready'))
    }
  })`

content = content.replace(oldRealtime, newRealtime)
fs.writeFileSync(path, content, 'utf8')
console.log('Done')
