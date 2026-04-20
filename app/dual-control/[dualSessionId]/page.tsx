'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useRealtime } from '@/hooks/useRealtime'
import { PecaControl } from './peca'
import { Bdi2Control } from './bdi2'
import { CoopersmithControl } from './coopersmith'
import { Wisc5Control } from './wisc5'

interface DualSession {
  id: string
  session_id: string
  room_code: string
  is_active: boolean
  session?: {
    id: string
    test_id: string
    status: string
  }
}

export default function DualControlPage() {
  const params = useParams()
  const router = useRouter()
  const dualSessionId = params.dualSessionId as string

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [dualSession, setDualSession] = useState<DualSession | null>(null)
  const [testId, setTestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayReady, setDisplayReady] = useState(false)

  // Usar el hook useRealtime para la comunicación
  const { sendMessage, connected } = useRealtime(dualSessionId || '', (payload) => {
    console.log('📨 Mensaje recibido en control:', payload)
    if (payload.type === 'display_ready') {
      console.log('✅ Display listo!')
      setDisplayReady(true)
    }
  })

  // Cargar sesión dual
  useEffect(() => {
    const loadDualSession = async () => {
      try {
        console.log('📋 Cargando sesión dual:', dualSessionId)
        const { data, error } = await supabase
          .from('dual_sessions')
          .select(`
            *,
            session:sessions (
              id,
              test_id,
              status
            )
          `)
          .eq('id', dualSessionId)
          .single()

        if (error) {
          console.error('Error loading dual session:', error)
          setError(`Error al cargar sesión: ${error.message}`)
          setLoading(false)
          return
        }

        if (!data) {
          setError('Sesión dual no encontrada')
          setLoading(false)
          return
        }

        console.log('✅ Sesión dual cargada:', data)
        setDualSession(data)
        setTestId(data.session?.test_id || null)
        setLoading(false)
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setError(`Error inesperado: ${err.message}`)
        setLoading(false)
      }
    }

    if (dualSessionId) {
      loadDualSession()
    }
  }, [dualSessionId, supabase])

  // Enviar mensaje al display del paciente
  const sendToDisplay = (content: any) => {
    console.log('📤 Enviando mensaje al display:', content)
    sendMessage({ type: 'update_display', content })
  }

  // Guardar respuesta del psicólogo
  const saveResponse = async (item: number, value: any) => {
    try {
      console.log(`💾 Respuesta guardada - Item ${item}:`, value)
      sendMessage({ type: 'response_saved', item, value })
    } catch (err) {
      console.error('Error saving response:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando sesión de control...</p>
        </div>
      </div>
    )
  }

  if (error || !dualSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-700 font-semibold mb-2">Error:</h2>
          <p className="text-red-600">{error || 'Sesión no encontrada'}</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  // Renderizar el control según el tipo de test
  const renderTestControl = () => {
    const commonProps = {
      dualSessionId,
      sessionId: dualSession.session_id,
      onUpdatePatient: sendToDisplay,
      onSaveResponse: saveResponse,
      displayReady
    }

    switch (testId) {
      case 'peca':
        return <PecaControl {...commonProps} />
      case 'bdi2':
        return <Bdi2Control {...commonProps} />
      case 'coopersmith':
        return <CoopersmithControl {...commonProps} />
      case 'wisc5':
        return <Wisc5Control {...commonProps} />
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-yellow-700 font-semibold mb-2">Test no soportado</h2>
            <p className="text-yellow-600">El test "{testId}" no está disponible en modo dual.</p>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Volver al dashboard
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header fijo con información de la sesión */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Salir
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="text-sm">
            <span className="text-gray-500">Código de sala:</span>
            <span className="ml-2 font-mono font-bold text-blue-600">{dualSession.room_code}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className={`flex items-center gap-1.5 ${connected ? 'text-green-600' : 'text-yellow-600'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span>{connected ? 'Paciente conectado' : 'Esperando paciente...'}</span>
          </div>
          {displayReady && (
            <span className="text-green-600 text-xs">✓ Display listo</span>
          )}
        </div>
      </div>

      {/* Contenido del test */}
      <div className="p-4">
        {renderTestControl()}
      </div>
    </div>
  )
}