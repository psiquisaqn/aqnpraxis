const fs = require('fs')
const path = 'app/sala/[code]/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// Log the exact bytes around the emoji
const idx = content.indexOf('\u00ad\u0192\u00f6\u00ec')
console.log('Found at:', idx)

// Replace all corrupted emojis
const replacements = [
  ['\u00ad\u0192\u00f6\u00ec', '\uD83D\uDD0D'],  // ??
  ['\u00ad\u0192\u00f4\u00af', '\uD83D\uDCCB'],  // ??
  ['\u00ad\u0192\u00f4\u00e0', '\uD83D\uDCC5'],  // ??
  ['\u00ad\u0192\u00f4\u00e5', '\uD83D\uDCC6'],  // ??
  ['\u00ad\u0192\u00f4\u00b2', '\uD83D\uDDB5'],  // ??
]

for (const [bad, good] of replacements) {
  if (content.includes(bad)) {
    content = content.split(bad).join(good)
    console.log('Replaced:', bad, '->', good)
  }
}

fs.writeFileSync(path, content, 'utf8')
console.log('Done')
