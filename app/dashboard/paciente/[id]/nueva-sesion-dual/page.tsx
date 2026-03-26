'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function NewDualSessionPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [loading, setLoading] = useState(false)

  const tests = [
    { id: 'coopersmith', name: 'Coopersmith SEI', description: 'Inventario de Autoestima', items: 58 },
    { id: 'bdi2', name: 'BDI-II', description: 'Inventario de Depresión de Beck', items: 21 },
    { id: 'peca', name: 'PECA', description: 'Prueba de Conducta Adaptativa', items: 45 },
    { id: 'wisc5', name: 'WISC-V', description: 'Escala de Inteligencia', items: 15 }
  ]

  const [selectedTest, setSelectedTest] = useState<string>('')

  const handleStart = () => {
    if (!selectedTest) return
    setLoading(true)
    // Por ahora solo muestra un mensaje, luego conectaremos con Supabase
    alert(`Iniciando evaluación dual con test: ${selectedTest}`)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Nueva evaluación dual</h1>
        <p className="text-gray-500 mb-6">Selecciona el test para comenzar</p>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Seleccionar test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tests.map((test) => (
              <button
                key={test.id}
                onClick={() => setSelectedTest(test.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedTest === test.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-800">{test.name}</div>
                <div className="text-xs text-gray-400 mt-1">{test.description}</div>
                <div className="text-xs text-gray-400 mt-2">{test.items} ítems</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!selectedTest || loading}
          className={`w-full py-3 rounded-xl font-medium transition-colors ${
            !selectedTest || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Iniciando...' : 'Continuar'}
        </button>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700">
            ⚠️ Esta es una versión preliminar. Próximamente se integrará con la selección de dispositivos.
          </p>
        </div>
      </div>
    </div>
  )
}