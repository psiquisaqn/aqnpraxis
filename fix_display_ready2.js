const fs = require('fs')
const path = 'app/sala/[code]/page.tsx'
let content = fs.readFileSync(path, 'utf8')

const oldRealtime = `  const { sendMessage } = useRealtime(dualSessionId || '', (payload) => {
    if (payload.type === 'update_display') {
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })`

const newRealtime = `  const { sendMessage } = useRealtime(dualSessionId || '', (payload) => {
    if (payload.type === 'update_display') {
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })

  // Cuando tenemos dualSessionId, avisar al control que el display esta listo
  useEffect(() => {
    if (!dualSessionId) return
    const timer = setTimeout(() => {
      sendMessage({ type: 'display_ready', message: 'Display listo' })
    }, 1000)
    return () => clearTimeout(timer)
  }, [dualSessionId])`

content = content.replace(oldRealtime, newRealtime)

// Agregar useEffect a los imports si no esta
if (!content.includes('useEffect')) {
  content = content.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'")
}

fs.writeFileSync(path, content, 'utf8')
console.log('Done')
