'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useRealtime } from '@/hooks/useRealtime'

export default function DualDisplayPage() {
  const params = useParams()
  const dualSessionId = params.dualSessionId as string

  const [currentDisplay, setCurrentDisplay] = useState<any>(null)
  const [waiting, setWaiting] = useState(true)
  const [messageCount, setMessageCount] = useState(0)

  const { sendMessage } = useRealtime(dualSessionId, (payload) => {
    console.log('Mensaje recibido:', payload)
    setMessageCount(prev => prev + 1)
    
    if (payload.type === 'update_display') {
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setWaiting(false)
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      sendMessage({
        type: 'display_ready',
        message: 'Display listo'
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [sendMessage])

  const renderDisplay = () => {
    if (!currentDisplay) return null

    switch (currentDisplay.type) {
      case 'coopersmith':
        const progressCoop = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 58)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 58}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressCoop}%` }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              Ítem {currentDisplay.item} de {currentDisplay.totalItems || 58}
            </div>
            <div className="text-2xl font-medium text-gray-800 mb-6 leading-relaxed">
              {currentDisplay.text}
            </div>
            <div className="flex gap-4 justify-center">
              {currentDisplay.options?.map((opt: string, idx: number) => (
                <div
                  key={idx}
                  className={`px-6 py-3 rounded-xl text-sm font-medium ${
                    currentDisplay.selected === (idx === 0 ? 'igual' : 'diferente')
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
            {currentDisplay.selected && <p className="text-xs text-green-600 mt-6">✓ Respuesta registrada</p>}
          </div>
        )

      case 'bdi2':
        const progressBdi = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 21)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 21}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressBdi}%` }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              Ítem {currentDisplay.item} de {currentDisplay.totalItems || 21}
            </div>
            <div className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
              {currentDisplay.label}
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div
                  key={opt.value}
                  className={`p-3 rounded-lg border ${
                    currentDisplay.selected === opt.value
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
            {currentDisplay.selected && <p className="text-xs text-green-600 mt-6">✓ Respuesta registrada</p>}
          </div>
        )

      case 'peca':
        const progressPeca = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 45)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 45}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPeca}%` }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              Ítem {currentDisplay.item} de {currentDisplay.totalItems || 45}
            </div>
            <div className="flex justify-between text-sm text-gray-700 mb-6 gap-4">
              <span className="flex-1">{currentDisplay.leftPhrase}</span>
              <span className="text-gray-400">← →</span>
              <span className="flex-1">{currentDisplay.rightPhrase}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div
                  key={opt.value}
                  className={`p-2 rounded-lg border text-xs ${
                    currentDisplay.selected === opt.value
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
            {currentDisplay.selected && <p className="text-xs text-green-600 mt-6">✓ Respuesta registrada</p>}
          </div>
        )

      default:
        return (
          <div className="text-center">
            <div className="text-2xl font-medium text-gray-800 mb-4">
              {currentDisplay.item || 'Preparando evaluación...'}
            </div>
            <div className="text-gray-600">
              {currentDisplay.content || 'Esperando instrucciones...'}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-2xl w-full mx-auto">
        <div className="fixed bottom-4 right-4 z-50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-md text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Salir
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="mb-4 p-2 bg-gray-100 rounded-lg text-xs font-mono">
            <div>🔌 ID: {dualSessionId.slice(0, 8)}...</div>
            <div>📨 Mensajes: {messageCount}</div>
            <div>⏳ Estado: {waiting ? 'Esperando...' : currentDisplay ? 'Activo' : 'Timeout'}</div>
          </div>

          {waiting && !currentDisplay ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">Esperando al psicólogo</h2>
              <p className="text-gray-400 text-sm">La evaluación comenzará en breve. Por favor, espera las instrucciones.</p>
              <div className="mt-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : currentDisplay ? (
            renderDisplay()
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">Tiempo de espera agotado</h2>
              <p className="text-gray-400 text-sm">La evaluación no ha comenzado. Contacta al psicólogo.</p>
              <Link href="/sala" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Volver al inicio
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}