const fs = require('fs')
let page = fs.readFileSync('app/dual-control/[dualSessionId]/page.tsx', 'utf8')

// Agregar import de Bdi2Control
page = page.replace(
  "import { PecaControl } from './peca'",
  "import { PecaControl } from './peca'\nimport { Bdi2Control } from './bdi2'"
)

// Agregar caso bdi2 en el render
page = page.replace(
  `        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-500 mb-4">Test {currentTest} no implementado en modo dual aun.</p>`,
  `        ) : currentTest === 'bdi2' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Bdi2Control
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
              displayReady={displayReady}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-500 mb-4">Test {currentTest} no implementado en modo dual aun.</p>`
)

fs.writeFileSync('app/dual-control/[dualSessionId]/page.tsx', page, 'utf8')
console.log('import:', page.includes("Bdi2Control"))
console.log('case bdi2:', page.includes("currentTest === 'bdi2'"))
