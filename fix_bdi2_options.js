const fs = require('fs')
let bdi2 = fs.readFileSync('app/dual-control/[dualSessionId]/bdi2.tsx', 'utf8')

// Agregar opciones fijas ya que BDI2_ITEMS no las tiene
bdi2 = bdi2.replace(
  "  const currentItemData = BDI2_ITEMS.find(item => item.num === currentItem)",
  `  const currentItemData = BDI2_ITEMS.find(item => item.num === currentItem)
  const BDI_OPTIONS = [
    { value: 0, label: '0 - No aplica' },
    { value: 1, label: '1 - Leve' },
    { value: 2, label: '2 - Moderado' },
    { value: 3, label: '3 - Grave' },
  ]`
)

// Usar BDI_OPTIONS en buildPayload
bdi2 = bdi2.replace(
  "      options: d?.options ?? [],",
  "      options: BDI_OPTIONS,"
)

// Usar BDI_OPTIONS en el render
bdi2 = bdi2.replace(
  "  {currentItemData?.options?.map((opt: any) => (",
  "  {BDI_OPTIONS.map((opt: any) => ("
)

// Tambien fix en el display del paciente - usar opt.label directamente
bdi2 = bdi2.replace(
  "      className={\`w-full text-left p-3 rounded-lg border text-sm transition-all \${responses[currentItem] === opt.value ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}\`}",
  "      className={'w-full text-left p-3 rounded-lg border text-sm transition-all ' + (responses[currentItem] === opt.value ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100')}"
)

fs.writeFileSync('app/dual-control/[dualSessionId]/bdi2.tsx', bdi2, 'utf8')
console.log('BDI_OPTIONS added:', bdi2.includes('BDI_OPTIONS'))
