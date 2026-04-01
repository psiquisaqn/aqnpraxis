const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')

// Reemplazar el patron exacto visto en JSON
content = content.split('+""+"`${(completed/45)*100}%"+""+').join('`${(completed/45)*100}%`')
content = content.split('+""+"`${responses[currentItem] === val ? \'bg-blue-600 text-white\' : \'bg-gray-100 text-gray-700 hover:bg-gray-200\'}"+""+').join('`${responses[currentItem] === val ? \'bg-blue-600 text-white\' : \'bg-gray-100 text-gray-700 hover:bg-gray-200\'}`')
content = content.split('+""+"`${currentItem===item.num ? \'bg-blue-600 text-white\' : responses[item.num] ? \'bg-green-100 text-green-700\' : \'bg-gray-100 text-gray-500\'}"+""+').join('`${currentItem===item.num ? \'bg-blue-600 text-white\' : responses[item.num] ? \'bg-green-100 text-green-700\' : \'bg-gray-100 text-gray-500\'}`')

fs.writeFileSync(path, content, 'utf8')
console.log('Done')
