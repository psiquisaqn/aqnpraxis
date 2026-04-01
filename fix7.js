const fs = require('fs')
const path = 'app/dual-control/[dualSessionId]/peca.tsx'
let content = fs.readFileSync(path, 'utf8')
const lines = content.split('\n')

// Fix line 81 - progress bar
lines[80] = '          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: ((completed/45)*100) + "%" }} />'

// Fix line 98 - button className
lines[97] = '              className={`py-2 rounded-lg font-medium text-sm transition-all ${responses[currentItem] === val ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}'

// Fix line 130 - item button className  
lines[129] = '              className={`text-xs py-1 rounded ${currentItem===item.num ? "bg-blue-600 text-white" : responses[item.num] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>'

fs.writeFileSync(path, lines.join('\n'), 'utf8')

// Verify no more broken templates
const result = fs.readFileSync(path, 'utf8')
const remaining = result.split('\n').filter(l => l.includes('+""+'))
console.log('Remaining broken lines:', remaining.length)
if(remaining.length > 0) remaining.forEach(l => console.log(' -', l.trim()))
else console.log('All fixed!')
