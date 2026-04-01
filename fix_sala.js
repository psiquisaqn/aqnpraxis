const fs = require('fs')

// Fix sala/page.tsx - formulario de ingreso de codigo
const salaPage = `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SalaPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Ingresa un codigo de sala'); return }
    router.push('/sala/' + trimmed)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">??</div>
          <h1 className="text-2xl font-bold text-gray-800">Sala de Evaluacion</h1>
          <p className="text-gray-500 mt-2 text-sm">Ingresa el codigo que te dio el psicologo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="Ej: AB12CD"
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 uppercase"
              maxLength={8}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Ingresar a la sala
          </button>
        </form>
      </div>
    </div>
  )
}
`

fs.writeFileSync('app/sala/page.tsx', salaPage, 'utf8')
console.log('sala/page.tsx OK')
