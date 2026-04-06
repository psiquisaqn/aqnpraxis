const fs = require('fs')

// Fix 1: emoji corrupto en sala/[code]/page.tsx
let sala = fs.readFileSync('app/sala/[code]/page.tsx', 'utf8')
sala = sala.replace('­ƒöì', '??')
fs.writeFileSync('app/sala/[code]/page.tsx', sala, 'utf8')
console.log('sala OK')

// Fix 2: eliminar boton Probar display en dual-control
let control = fs.readFileSync('app/dual-control/[dualSessionId]/page.tsx', 'utf8')

// Eliminar funcion sendTestMessage
control = control.replace(`  const sendTestMessage = () => {
    updatePatientScreen({ type: 'test', message: 'Mensaje de prueba' })
  }\n\n`, '')

// Eliminar boton del JSX
control = control.replace(`              <button onClick={sendTestMessage} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium transition-colors">
                Probar display
              </button>\n`, '')

fs.writeFileSync('app/dual-control/[dualSessionId]/page.tsx', control, 'utf8')
console.log('control OK')
