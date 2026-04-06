const fs = require('fs')
let hook = fs.readFileSync('hooks/useRealtime.ts', 'utf8')

// Fix import
hook = hook.replace(
  "import { useEffect, useRef } from 'react'",
  "import { useEffect, useRef, useState } from 'react'"
)

// Fix subscribe call - buscar channel.subscribe() y reemplazar
hook = hook.replace(
  /channel\.subscribe\(\)/,
  `channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') setConnected(true)
    })`
)

// Agregar estado connected despues de channelRef
hook = hook.replace(
  '  const channelRef = useRef<any>(null)',
  '  const channelRef = useRef<any>(null)\n  const [connected, setConnected] = useState(false)'
)

// Reset connected on cleanup
hook = hook.replace(
  '      channel.unsubscribe()',
  '      channel.unsubscribe()\n      setConnected(false)'
)

// Exportar connected
hook = hook.replace(
  '  return { sendMessage }',
  '  return { sendMessage, connected }'
)

fs.writeFileSync('hooks/useRealtime.ts', hook, 'utf8')
const result = fs.readFileSync('hooks/useRealtime.ts', 'utf8')
console.log('connected state:', result.includes('const [connected, setConnected]'))
console.log('SUBSCRIBED:', result.includes('SUBSCRIBED'))
console.log('return connected:', result.includes('connected }'))
