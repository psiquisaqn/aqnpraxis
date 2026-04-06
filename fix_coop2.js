const fs = require('fs')
let coop = fs.readFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', 'utf8')
const lines = coop.split('\n')
const result = []
let skipMode = false
let braceDepth = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  
  // Detectar inicio del bloque a eliminar
  if (!skipMode && line.includes('useEffect') && 
      i+2 < lines.length && 
      (lines[i+1].includes('handleDisplayReady') || lines[i+2].includes('handleDisplayReady'))) {
    skipMode = true
    braceDepth = 0
  }
  
  if (skipMode) {
    // Contar llaves para saber cuando termina el bloque
    for (const ch of line) {
      if (ch === '{') braceDepth++
      if (ch === '}') braceDepth--
    }
    // Cuando cerramos todas las llaves del useEffect
    if (braceDepth <= 0 && line.includes(')')) {
      skipMode = false
    }
    continue // saltar esta linea
  }
  
  result.push(line)
}

const newContent = result.join('\n')
fs.writeFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', newContent, 'utf8')
console.log('window.addEventListener present:', newContent.includes('window.addEventListener'))
console.log('Lines removed:', lines.length - result.length)
