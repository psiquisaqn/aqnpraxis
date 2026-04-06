const fs = require('fs')
let hook = fs.readFileSync('hooks/useRealtime.ts', 'utf8')

hook = hook.replace(
  "    channel.on('broadcast', { event: 'message' }, (payload) => {\n      onMessage(payload)\n    })",
  "    channel.on('broadcast', { event: 'message' }, (payload) => {\n      onMessage(payload.payload ?? payload)\n    })"
)

fs.writeFileSync('hooks/useRealtime.ts', hook, 'utf8')
console.log('OK:', hook.includes('payload.payload'))
