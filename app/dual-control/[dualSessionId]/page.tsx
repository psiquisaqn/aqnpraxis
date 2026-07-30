'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Wisc5Control } from './wisc5'
import { Bdi2Control } from './bdi2'
import { CoopersmithControl } from './coopersmith'
import { PecaControl } from './peca'

export default function DualControlPage() {
  const params = useParams()
  const dualSessionId = params.dualSessionId as string
  const [sessionData, setSessionData] = useState<{
    sessionId: string
    testId: string
    patientId?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDualSession = async () => {
      if (!dualSessionId) {
        setError('ID de sesión dual no válido')
        setLoading(false)
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Obtener la sesión dual y la sesión asociada
      const { data: dualData, error: dualError } = await supabase
        .from('dual_sessions')
        .select('session_id')
        .eq('id', dualSessionId)
        .single()

      if (dualError) {
        console.error('❌ Error al obtener dual_session:', dualError)
        setError('No se pudo cargar la sesión dual.')
        setLoading(false)
        return
      }

      if (!dualData?.session_id) {
        setError('No se encontró la sesión asociada.')
        setLoading(false)
        return
      }

      // Obtener la sesión real para saber el test_id
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, test_id, patient_id')
        .eq('id', dualData.session_id)
        .single()

      if (sessionError) {
        console.error('❌ Error al obtener sesión:', sessionError)
        setError('No se pudo cargar la sesión.')
        setLoading(false)
        return
      }

      setSessionData({
        sessionId: session.id,
        testId: session.test_id,
        patientId: session.patient_id,
      })
      setLoading(false)
    }

    loadDualSession()
  }, [dualSessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando panel...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-600">{error || 'Sesión no encontrada'}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Renderizar el control según el test_id
  const { sessionId, testId, patientId } = sessionData

  // Props comunes
  const commonProps = {
    dualSessionId,
    sessionId,
    onUpdatePatient: () => {},
    onSaveResponse: () => {},
  }

  switch (testId) {
    case 'bdi2':
      return <Bdi2Control {...commonProps} />
    case 'coopersmith':
      return <CoopersmithControl {...commonProps} />
    case 'peca':
      return <PecaControl {...commonProps} />
    case 'wisc5':
      return <Wisc5Control {...commonProps} />
    default:
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center max-w-md">
            <p className="text-yellow-700">
              Test no soportado: <strong>{testId}</strong>
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
            >
              Volver
            </button>
          </div>
        </div>
      )
  }
}