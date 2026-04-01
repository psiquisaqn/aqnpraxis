'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/useRealtime'
import { CoopersmithControl } from './coopersmith'
import { PecaControl } from './peca'

export default function DualControlPage() {
  const params = useParams()
  const router = useRouter()
  const dualSessionId = params.dualSessionId as string

  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')

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
        setError('No se pudo cargar la sesion')
      } else {
        setSessionData(data)
        setCurrentTest(data.session.test_id)
        setSessionId(data.session.id)
      }
      setLoading(false)
    }
    loadSession()
  }, [dualSessionId])

  const { sendMessage } = useRealtime(dualSessionId, (payload) => {
    console.log('Mensaje recibido en control:', payload)
  })

  const updatePatientScreen = async (content: any) => {
    sendMessage({ type: 'update_display', content })
  }

  const saveResponse = async (item: number, value: any) => {
    const { error } = await supabase
      .from('dual_session_tests')
      .upsert({
        dual_session_id: dualSessionId,
        test_id: currentTest,
        current_item: item,
        responses: { [item]: value }
      }, { onConflict: 'dual_session_id' })
    if (error) console.error('Error saving response:', error)
  }

  const sendTestMessage = () => {
    updatePatientScreen({ type: 'test', message: 'Mensaje de prueba' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando sesion...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error || 'Sesion no encontrada'}</p>
          <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:text-blue-700">
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  const testLabel =
    currentTest === 'coopersmith' ? 'Coopersmith SEI' :
    currentTest === 'peca' ? 'PECA' :
    currentTest === 'bdi2' ? 'BDI-II' : currentTest

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Control de evaluacion</h1>
              <p className="text-sm text-gray-500">Paciente: {sessionData.session?.patient?.full_name}</p>
              <p className="text-xs text-gray-400 mt-1">Test: {testLabel}</p>
              <p className="text-xs text-gray-400 mt-1">
                Codigo de sala: <span className="font-mono font-bold text-blue-600 text-sm">{sessionData?.room_code}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={sendTestMessage} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium transition-colors">
                Probar display
              </button>
              <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-gray-700">
                Salir
              </button>
            </div>
          </div>
        </div>

        {currentTest === 'coopersmith' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <CoopersmithControl
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
            />
          </div>
        ) : currentTest === 'peca' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <PecaControl
              dualSessionId={dualSessionId}
              sessionId={sessionId}
              onUpdatePatient={updatePatientScreen}
              onSaveResponse={saveResponse}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-500 mb-4">Test {currentTest} no implementado en modo dual aun.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Volver al dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}