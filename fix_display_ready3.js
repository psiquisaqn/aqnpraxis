const fs = require('fs')

// Fix page.tsx - agregar estado displayReady y pasarlo como prop
let page = fs.readFileSync('app/dual-control/[dualSessionId]/page.tsx', 'utf8')

// Agregar estado displayReady
page = page.replace(
  "  const [sessionId, setSessionId] = useState<string>('')",
  "  const [sessionId, setSessionId] = useState<string>('')\n  const [displayReady, setDisplayReady] = useState(false)"
)

// Actualizar handler de display_ready
page = page.replace(
  `    if (payload.type === 'display_ready') {
      console.log('Display listo, disparando evento...')
      window.dispatchEvent(new Event('display_ready'))
    }`,
  `    if (payload.type === 'display_ready') {
      console.log('Display listo')
      setDisplayReady(true)
    }`
)

// Pasar displayReady como prop a CoopersmithControl
page = page.replace(
  `            <CoopersmithControl
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
            />`,
  `            <CoopersmithControl
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
              displayReady={displayReady}
            />`
)

// Pasar displayReady como prop a PecaControl
page = page.replace(
  `            <PecaControl
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
            />`,
  `            <PecaControl
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
              displayReady={displayReady}
            />`
)

fs.writeFileSync('app/dual-control/[dualSessionId]/page.tsx', page, 'utf8')
console.log('page.tsx OK')

// Fix coopersmith.tsx - usar prop displayReady en vez de window event
let coop = fs.readFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', 'utf8')

// Actualizar interface
coop = coop.replace(
  `  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: CooperResponse) => void
}`,
  `  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: CooperResponse) => void
  displayReady?: boolean
}`
)

// Reemplazar useState displayReady y window listener
coop = coop.replace(
  `  const [displayReady, setDisplayReady] = useState(false)`,
  ``
)

coop = coop.replace(
  `  // Escuchar mensaje de display listo
  useEffect(() => {
    // Escuchar el mensaje de display_ready a través de una función global
    const handleDisplayReady = () => {
      console.log('Display listo, enviando ítem inicial...')
      setDisplayReady(true)
    }

    window.addEventListener('display_ready', handleDisplayReady)
    return () => window.removeEventListener('display_ready', handleDisplayReady)
  }, [])`,
  ``
)

fs.writeFileSync('app/dual-control/[dualSessionId]/coopersmith.tsx', coop, 'utf8')
console.log('coopersmith.tsx OK')

// Fix peca.tsx - usar prop displayReady en vez de window event
let peca = fs.readFileSync('app/dual-control/[dualSessionId]/peca.tsx', 'utf8')

// Actualizar interface
peca = peca.replace(
  `  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
}`,
  `  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}`
)

fs.writeFileSync('app/dual-control/[dualSessionId]/peca.tsx', peca, 'utf8')
console.log('peca.tsx OK')
