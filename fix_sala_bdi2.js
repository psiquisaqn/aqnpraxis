const fs = require('fs')
let sala = fs.readFileSync('app/sala/[code]/page.tsx', 'utf8')

const bdi2Case = `      case 'bdi2':
        const progressBdi = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 21)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 21}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: progressBdi + '%' }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">Item {currentDisplay.item} de {currentDisplay.totalItems || 21}</div>
            <div className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">{currentDisplay.label}</div>
            <div className="space-y-3 max-w-md mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div key={opt.value}
                  className={"p-3 rounded-xl border text-sm " + (currentDisplay.selected === opt.value ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-500 border-gray-200")}
                >
                  {opt.label}
                </div>
              ))}
            </div>
            {currentDisplay.selected !== undefined && <p className="text-xs text-green-600 mt-4">Respuesta registrada</p>}
          </div>
        )

      `

sala = sala.replace("      case 'peca':", bdi2Case + "case 'peca':")
fs.writeFileSync('app/sala/[code]/page.tsx', sala, 'utf8')
console.log('bdi2 case added:', sala.includes("case 'bdi2'"))
