const fs = require('fs')
let sala = fs.readFileSync('app/sala/[code]/page.tsx', 'utf8')

// Reemplazar el useEffect problemático con uno que use una ref para enviar solo una vez
sala = sala.replace(
  `  // Cuando el canal esta conectado, avisar al control
  useEffect(() => {
    if (!connected || !dualSessionId) return
    sendMessage({ type: 'display_ready', message: 'Display listo' })
  }, [connected, dualSessionId])`,
  `  // Cuando el canal esta conectado, avisar al control (solo una vez)
  const displayReadySent = useRef(false)
  useEffect(() => {
    if (!connected || !dualSessionId || displayReadySent.current) return
    displayReadySent.current = true
    sendMessage({ type: 'display_ready', message: 'Display listo' })
  }, [connected, dualSessionId])`
)

// Agregar useRef al import si no esta
if (!sala.includes('useRef')) {
  sala = sala.replace(
    "import { useState, useEffect } from 'react'",
    "import { useState, useEffect, useRef } from 'react'"
  )
}

fs.writeFileSync('app/sala/[code]/page.tsx', sala, 'utf8')
console.log('useRef added:', sala.includes('displayReadySent'))
