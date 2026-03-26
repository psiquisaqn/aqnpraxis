'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRealtime } from '@/hooks/useRealtime'

export default function DualDisplayPage() {
  const params = useParams()
  const dualSessionId = params.dualSessionId as string

  const [currentDisplay, setCurrentDisplay] = useState<any>(null)
  const [waiting, setWaiting] = useState(true)

  // Escuchar comandos del psicólogo
  useRealtime(dualSessionId, (payload) => {
    if (payload.type === 'update_display') {
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })

  useEffect(() => {
    // Timeout de espera
    const timer = setTimeout(() => {
      setWaiting(false)
    }, 10000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {waiting && !currentDisplay ? (
          <>
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Esperando al psicólogo</h2>
            <p className="text-gray-400 text-sm">
              La evaluación comenzará en breve. Por favor, espera las instrucciones.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        ) : currentDisplay ? (
          <div>
            <div className="text-4xl mb-4">📋</div>
            <div className="text-2xl font-medium text-gray-800 mb-4">
              {currentDisplay.item || 'Ítem'}
            </div>
            <div className="text-gray-600">
              {currentDisplay.content || 'Preparando evaluación...'}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Tiempo de espera agotado</h2>
            <p className="text-gray-400 text-sm">
              La evaluación no ha comenzado. Contacta al psicólogo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}