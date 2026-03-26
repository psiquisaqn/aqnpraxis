'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function DualDisplayPage() {
  const params = useParams()
  const dualSessionId = params.dualSessionId as string

  const [waiting, setWaiting] = useState(true)

  useEffect(() => {
    // Simular espera
    const timer = setTimeout(() => {
      setWaiting(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {waiting ? (
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
        ) : (
          <>
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Evaluación lista</h2>
            <p className="text-gray-500 text-sm">
            El psicólogo está controlando la evaluación. Presta atención a las instrucciones.
            </p>
          </>
        )}
      </div>
    </div>
  )
}