const fs = require('fs')
let peca = fs.readFileSync('app/dual-control/[dualSessionId]/peca.tsx', 'utf8')

// Agregar displayReady = false a la desestructuracion de props
peca = peca.replace(
  'export function PecaControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse }',
  'export function PecaControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }'
)

// Agregar useEffect que reacciona a displayReady despues del useEffect del timeout
const timeoutEffect = `  useEffect(() => {
    const timer = setTimeout(() => {
      if (!firstItemSent.current) {
        onUpdatePatient(buildPayload(1))
        firstItemSent.current = true
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])`

const newTimeoutEffect = timeoutEffect + `

  // Reenviar item cuando display se conecta
  useEffect(() => {
    if (displayReady) {
      onUpdatePatient(buildPayload(currentItem, responses[currentItem] as number | undefined))
      firstItemSent.current = true
    }
  }, [displayReady])`

peca = peca.replace(timeoutEffect, newTimeoutEffect)

fs.writeFileSync('app/dual-control/[dualSessionId]/peca.tsx', peca, 'utf8')
console.log('displayReady prop:', peca.includes('displayReady = false'))
console.log('displayReady useEffect:', peca.includes('if (displayReady)'))
