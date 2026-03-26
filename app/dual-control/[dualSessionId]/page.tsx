'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/useRealtime'

export default function DualControlPage() {
  const params = useParams()
  const router = useRouter()
  const dualSessionId = params.dualSessionId as string

  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTest, setCurrentTest] = useState<string>('')

  const supabase = createClient()

  // Cargar datos de la sesión dual
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
      }
      setLoading(false)
    }

    loadSession()
  }, [dualSessionId])

  // Sincronización en tiempo real
  const { sendMessage } = useRealtime(dualSessionId, (payload) => {
    if (payload.type === 'sync_response') {
      // Actualizar respuestas
      console.log('Respuesta recibida:', payload)
    }
  })

  const updatePatientScreen = async (content: any) => {
    sendMessage({
      type: 'update_display',
      content
    })
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
                Test: {currentTest} | ID: {dualSessionId}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-4xl mb-3">🎮</div>
          <p className="text-gray-500 mb-4">
            Evaluación dual - Test {currentTest}
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 text-left mb-4">
            <p className="text-sm text-blue-700 font-medium mb-2">Controles:</p>
            <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
              <li>Navegación entre ítems</li>
              <li>Registro de respuestas</li>
              <li>Sincronización con pantalla del paciente</li>
              <li>Finalización de la evaluación</li>
            </ul>
          </div>

          <button
            onClick={() => updatePatientScreen({ message: 'Preparando evaluación...' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Probar sincronización
          </button>
        </div>
      </div>
    </div>
  )
}