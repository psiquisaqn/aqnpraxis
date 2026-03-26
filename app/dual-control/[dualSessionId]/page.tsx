'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function DualControlPage() {
  const params = useParams()
  const dualSessionId = params.dualSessionId as string

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Configurando control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h1 className="text-lg font-semibold text-gray-800">Control de evaluación</h1>
          <p className="text-sm text-gray-500">Pantalla del psicólogo</p>
          <p className="text-xs text-gray-400 mt-2">ID de sesión dual: {dualSessionId}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-4xl mb-3">🎮</div>
          <p className="text-gray-500 mb-4">
            Esta pantalla permitirá al psicólogo controlar la evaluación
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-700 font-medium mb-2">Próximamente:</p>
            <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
              <li>Selección de test (Coopersmith, BDI-II, PECA)</li>
              <li>Control de navegación de ítems</li>
              <li>Registro de respuestas en tiempo real</li>
              <li>Sincronización con pantalla del paciente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}