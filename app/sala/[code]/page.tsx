'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useRealtime } from '@/hooks/useRealtime'

export default function SalaDisplayPage() {
  const params = useParams()
  const code = params.code as string

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [currentDisplay, setCurrentDisplay] = useState<any>(null)
  const [waiting, setWaiting] = useState(true)
  const [dualSessionId, setDualSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Para evitar mensajes duplicados
  const lastMessageRef = useRef<string | null>(null)
  const displayReadySent = useRef(false)

  // Buscar sesión dual por código
  useEffect(() => {
    const findSession = async () => {
      const cleanCode = code.trim().toUpperCase()
      console.log('=== BÚSQUEDA DE SALA ===')
      console.log('Código original:', code)
      console.log('Código limpio:', cleanCode)
      
      try {
        const { data, error } = await supabase
          .from('dual_sessions')
          .select('*')
          .eq('room_code', cleanCode)
          .eq('is_active', true)
          .maybeSingle()

        if (error || !data) {
          console.log('No se encontró sala')
          setError('Código inválido o sesión no encontrada')
          setWaiting(false)
        } else {
          console.log('✅ Sala encontrada! ID:', data.id)
          setDualSessionId(data.id)
        }
      } catch (err) {
        console.error('Error inesperado:', err)
        setError('Error al conectar con el servidor')
        setWaiting(false)
      }
    }

    if (code) {
      findSession()
    }
  }, [code, supabase])

  // Escuchar comandos del psicólogo - con prevención de duplicados
  const { sendMessage, connected } = useRealtime(dualSessionId || '', (payload) => {
    console.log('📨 Mensaje recibido en display:', payload)
    
    // Evitar procesar el mismo mensaje repetidamente
    const messageKey = JSON.stringify(payload)
    if (lastMessageRef.current === messageKey) {
      console.log('⚠️ Mensaje duplicado ignorado')
      return
    }
    lastMessageRef.current = messageKey
    
    if (payload.type === 'update_display') {
      console.log('🖥️ Actualizando display con:', payload.content)
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })

  // Enviar display_ready solo una vez
  useEffect(() => {
    if (!connected || !dualSessionId || displayReadySent.current) return
    displayReadySent.current = true
    console.log('📡 Enviando display_ready (única vez)')
    sendMessage({ type: 'display_ready', message: 'Display listo' })
  }, [connected, dualSessionId, sendMessage])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Código inválido</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Link href="/sala" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Volver al inicio
          </Link>
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
      case 'wisc5_cc':
        const stimulusNum = currentDisplay.stimulusNum || 1
        const imagePath = `/wisc5/cc/cubos${String(stimulusNum).padStart(3, '0')}.png`
        const isTwoAttempts = currentDisplay.twoAttempts || false
        const currentAttempt = currentDisplay.currentAttempt || 1
        const totalItems = currentDisplay.totalItems || 13
        
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Construcción con Cubos</span>
                <span>Ítem {stimulusNum}/{totalItems}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(stimulusNum / totalItems) * 100}%` }} />
              </div>
            </div>
            
            <div className="mb-8">
              <img 
                src={imagePath} 
                alt={`Modelo ${stimulusNum}`}
                className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg shadow-md"
                onError={(e) => {
                  console.error(`Error cargando imagen: ${imagePath}`)
                  e.currentTarget.src = '/placeholder-image.png'
                }}
              />
            </div>
            
            <div className="text-gray-600 text-sm mb-4">
              {currentDisplay.instructions || 'Construye la figura usando los cubos. Observa el modelo y repite la construcción.'}
            </div>
            
            {isTwoAttempts && (
              <div className="text-xs text-gray-400">Intento {currentAttempt} de 2</div>
            )}
            
            {currentDisplay.selected !== undefined && (
              <p className="text-xs text-green-600 mt-4">✓ Respuesta registrada</p>
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="fixed top-4 right-4 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 8H4M8 12L4 8L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver al panel principal
        </Link>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400">Código de sala: {code}</div>
        </div>

        {waiting && !currentDisplay ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Aquí se verán los estímulos de la evaluación</h2>
            <p className="text-gray-400 text-sm">La evaluación comenzará en breve. Por favor, espera las instrucciones.</p>
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
            <p className="text-gray-400 text-sm">La evaluación no ha comenzado. Contacta al especialista.</p>
          </div>
        )}
      </div>
    </div>
  )
}