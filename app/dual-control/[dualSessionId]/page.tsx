'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/useRealtime'
import { CoopersmithControl } from './coopersmith'

export default function DualControlPage() {
  const params = useParams()
  const router = useRouter()
  const dualSessionId = params.dualSessionId as string

  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [roomCode, setRoomCode] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase
        .from('dual_sessions')
        .select(`
          *,
          session:sessions(
            id,
            patient:patients(full_name),
            test_id
          )
        `)
        .eq('id', dualSessionId)
        .single()

      if (error) {
        console.error('Error loading dual session:', error)
        setError('No se pudo cargar la sesión')
      } else {
        setSessionData(data)
        setCurrentTest(data.session.test_id)
        setSessionId(data.session.id)
        setRoomCode(data.room_code || '')
      }
      setLoading(false)
    }

    loadSession()
  }, [dualSessionId])

  const { sendMessage } = useRealtime(dualSessionId, (payload) => {
    console.log('Mensaje recibido en control:', payload)
    if (payload.type === 'sync_response') {
      console.log('Respuesta recibida:', payload)
    }
    if (payload.type === 'display_ready') {
      console.log('Display listo, enviando evento al componente...')
      window.dispatchEvent(new CustomEvent('display_ready'))
    }
  })

  const updatePatientScreen = async (content: any) => {
    console.log('Enviando a display:', content)
    sendMessage({
      type: 'update_display',
      content
    })
  }

  const saveResponse = async (item: number, value: string) => {
    const { error } = await supabase
      .from('dual_session_tests')
      .upsert({
        dual_session_id: dualSessionId,
        test_id: currentTest,
        current_item: item,
        responses: { [item]: value }
      }, { onConflict: 'dual_session_id' })

    if (error) {
      console.error('Error saving response:', error)
    }
  }

  const sendTestMessage = () => {
    console.log('Enviando mensaje de prueba al display')
    updatePatientScreen({
      type: 'test',
      message: 'Mensaje de prueba',
      timestamp: new Date().toISOString()
    })
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert('Código copiado al portapapeles')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error || 'Sesión no encontrada'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Control de evaluación</h1>
              <p className="text-sm text-gray-500">
                Paciente: {sessionData.session?.patient?.full_name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Test: {currentTest === 'coopersmith' ? 'Coopersmith SEI' : currentTest}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={sendTestMessage}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                Probar display
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Código de sala */}
        {roomCode && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4 text-center border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Código de la sala</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-3xl font-mono font-bold tracking-wider text-blue-800">
                {roomCode}
              </p>
              <button
                onClick={copyRoomCode}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg text-xs text-blue-700 transition-colors"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs text-blue-500 mt-2">
              Comparte este código con el paciente. Debe ingresar en:{' '}
              <span className="font-mono">aqnpraxis.vercel.app/sala</span>
            </p>
          </div>
        )}

        {currentTest === 'coopersmith' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <CoopersmithControl
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-gray-500 mb-4">
              Evaluación dual - Test {currentTest}
            </p>
            <div className="bg-yellow-50 rounded-lg p-4 text-left">
              <p className="text-sm text-yellow-700">
                ⚠️ Este test aún no está implementado en modo dual.
                Próximamente se agregará soporte para {currentTest}.
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Volver al dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}