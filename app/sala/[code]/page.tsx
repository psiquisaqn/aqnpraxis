'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/useRealtime'

export default function SalaDisplayPage() {
  const params = useParams()
  const code = params.code as string

  const [currentDisplay, setCurrentDisplay] = useState<any>(null)
  const [waiting, setWaiting] = useState(true)
  const [dualSessionId, setDualSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  

  // Buscar sesión dual por código
  useEffect(() => {
    const findSession = async () => {
      const { data, error } = await supabase
        .from('dual_sessions')
        .select('id, session_id, screen2_device_id')
        .eq('room_code', code)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setError('Código inválido o sesión no encontrada')
        setWaiting(false)
      } else {
        setDualSessionId(data.id)
      }
    }

    findSession()
  }, [code])

  // Escuchar comandos del psicólogo
  const { sendMessage, connected } = useRealtime(dualSessionId || '', (payload) => {
    if (payload.type === 'update_display') {
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })

  // Cuando el canal esta conectado, avisar al control (solo una vez)
  const displayReadySent = useRef(false)
  useEffect(() => {
    if (!connected || !dualSessionId || displayReadySent.current) return
    displayReadySent.current = true
    sendMessage({ type: 'display_ready', message: 'Display listo' })
  }, [connected, dualSessionId])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Código inválido</h2>
          <p className="text-gray-400 text-sm mb-4">
            No se encontró una evaluación activa con este código.
          </p>
          <a
            href="/sala"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  if (!dualSessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Buscando evaluación...</p>
        </div>
      </div>
    )
  }

  const renderDisplay = () => {
    if (!currentDisplay) return null

    switch (currentDisplay.type) {
      case 'coopersmith':
        const progress = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 58)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 58}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              ├ìtem {currentDisplay.item} de {currentDisplay.totalItems || 58}
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
            {currentDisplay.selected && (
              <p className="text-xs text-green-600 mt-6 flex items-center justify-center gap-1">
                <span>Ô£ô</span> Respuesta registrada
              </p>
            )}
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400">Código de sala: {code}</div>
        </div>

        {waiting && !currentDisplay ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Esperando al psicólogo</h2>
            <p className="text-gray-400 text-sm">
              La evaluación comenzará en breve. Por favor, espera las instrucciones.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : currentDisplay ? (
          renderDisplay()
        ) : (
          <div className="text-center">
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