const fs = require('fs')

// Fix sala/[code]/page.tsx - agregar caso peca en renderDisplay y fix encoding
let content = fs.readFileSync('app/sala/[code]/page.tsx', 'utf8')

// Fix encoding
content = content.replace('+ìtem', 'Item')
content = content.replace('­ƒöì', '??')
content = content.replace('Ô£ô', '?')

// Agregar caso peca antes del default
const defaultCase = `      default:
        return (
          <div className="text-center">
            <div className="text-2xl font-medium text-gray-800 mb-4">
              {currentDisplay.item || 'Preparando evaluación...'}
            </div>
            <div className="text-gray-600">
              {currentDisplay.content || 'Esperando instrucciones...'}
            </div>
          </div>
        )`

const pecaCase = `      case 'peca':
        const progressPeca = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 45)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 45}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: progressPeca + '%' }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-6">Item {currentDisplay.item} de {currentDisplay.totalItems || 45}</div>
            <div className="flex justify-between gap-6 mb-8">
              <span className="flex-1 text-left text-lg font-medium text-gray-800">{currentDisplay.leftPhrase}</span>
              <span className="text-gray-400 text-lg">?</span>
              <span className="flex-1 text-right text-lg font-medium text-gray-800">{currentDisplay.rightPhrase}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div key={opt.value}
                  className={"p-3 rounded-xl border text-sm font-medium " + (currentDisplay.selected === opt.value ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-200')}
                >
                  {opt.value}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2 max-w-sm mx-auto px-2">
              <span>Izquierda</span><span>Derecha</span>
            </div>
            {currentDisplay.selected && <p className="text-xs text-green-600 mt-4">? Respuesta registrada</p>}
          </div>
        )

      ` + defaultCase

content = content.replace(defaultCase, pecaCase)
fs.writeFileSync('app/sala/[code]/page.tsx', content, 'utf8')
console.log('sala/[code]/page.tsx OK')
