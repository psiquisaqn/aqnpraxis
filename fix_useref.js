const fs = require('fs')
let sala = fs.readFileSync('app/sala/[code]/page.tsx', 'utf8')
sala = sala.replace(
  "import { useState, useEffect } from 'react'",
  "import { useState, useEffect, useRef } from 'react'"
)
fs.writeFileSync('app/sala/[code]/page.tsx', sala, 'utf8')
console.log('OK:', sala.includes('useRef'))
