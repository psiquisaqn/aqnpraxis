const fs = require('fs')

let coop = fs.readFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', 'utf8')

// Eliminar el useState de displayReady (ahora viene como prop)
coop = coop.replace("  const [displayReady, setDisplayReady] = useState(false)\n", '')

// Reemplazar el useEffect con window listener por uno que use la prop
const lines = coop.split('\n')
const result = []
let skip = false
let braceCount = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  
  // Detectar inicio del useEffect con window listener
  if (line.includes('window.addEventListener') || 
      (skip === false && line.includes('handleDisplayReady') && lines[i+1] && lines[i+1].includes('setDisplayReady'))) {
    // buscar el useEffect que lo contiene hacia atras
  }
  
  if (!skip) {
    result.push(line)
  }
}

// Mejor approach: reemplazar el bloque completo con regex
coop = coop.replace(
  /\/\/ Escuchar mensaje de display listo[\s\S]*?window\.removeEventListener\('display_ready', handleDisplayReady\)\s*\}\s*\}, \[\]\)/,
  ''
)

// Reemplazar el useEffect que usa displayReady state por uno que usa la prop
coop = coop.replace(
  /useEffect\(\(\) => \{\s*if \(displayReady\) \{[\s\S]*?\}, \[displayReady, currentItem, completed\]\)/,
  `useEffect(() => {
    if (displayReady) {
      sendCurrentItemToDisplay()
    }
  }, [displayReady, currentItem, completed])`
)

// Agregar displayReady a la desestructuracion de props
coop = coop.replace(
  'export function CoopersmithControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse }',
  'export function CoopersmithControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }'
)

fs.writeFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', coop, 'utf8')

// Verificar
const result2 = fs.readFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', 'utf8')
console.log('window.addEventListener present:', result2.includes('window.addEventListener'))
console.log('displayReady prop present:', result2.includes('displayReady = false'))
