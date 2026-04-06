const fs = require('fs')
let sala = fs.readFileSync('app/sala/[code]/page.tsx', 'utf8')

// Fix 1: agregar connected
sala = sala.replace(
  "  const { sendMessage } = useRealtime(dualSessionId || '', (payload) => {",
  "  const { sendMessage, connected } = useRealtime(dualSessionId || '', (payload) => {"
)

// Fix 2: reemplazar useEffect del timeout por uno basado en connected
const lines = sala.split('\n')
const result = []
let skipMode = false
let braceDepth = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  
  if (!skipMode && line.includes('// Cuando tenemos dualSessionId')) {
    skipMode = true
    braceDepth = 0
    // Insertar el nuevo useEffect
    result.push('  // Cuando el canal esta conectado, avisar al control')
    result.push('  useEffect(() => {')
    result.push('    if (!connected || !dualSessionId) return')
    result.push('    sendMessage({ type: \'display_ready\', message: \'Display listo\' })')
    result.push('  }, [connected, dualSessionId])')
  }
  
  if (skipMode) {
    for (const ch of line) {
      if (ch === '{') braceDepth++
      if (ch === '}') braceDepth--
    }
    if (braceDepth <= 0 && line.includes(')')) {
      skipMode = false
    }
    continue
  }
  
  result.push(line)
}

sala = result.join('\n')
fs.writeFileSync('app/sala/[code]/page.tsx', sala, 'utf8')
console.log('connected:', sala.includes('connected'))
console.log('new useEffect:', sala.includes('if (!connected || !dualSessionId)'))
