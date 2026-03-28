'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SalaPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleJoin = () => {
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      setError('Ingresa el código de la sala')
      return
    }
    
    setLoading(true)
    router.push(`/sala/${trimmedCode}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/isotipoaqnpraxis.png" 
              alt="AQN Praxis" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">Sala de evaluación</h1>
          <p className="text-gray-500 mt-2">
            Ingresa el código que te proporcionó el psicólogo
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de sala
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-wider uppercase"
              maxLength={8}
              autoFocus
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar a la evaluación'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}