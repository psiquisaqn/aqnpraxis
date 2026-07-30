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
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [testId, setTestId] = useState<string | null>(null)
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

      // Obtener la sesión dual con el test_id
      const { data, error } = await supabase
        .from('dual_sessions')
        .select('session_id, test_id')
        .eq('id', dualSessionId)
        .single()

      if (error) {
        console.error('❌ Error al obtener dual_session:', error)
        setError('No se pudo cargar la sesión dual.')
        setLoading(false)
        return
      }

      if (data?.session_id) {
        setSessionId(data.session_id)
        setTestId(data.test_id)
      } else {
        setError('No se encontró la sesión asociada.')
      }
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

  if (error || !sessionId || !testId) {
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

  // Renderizar el control según test_id
  console.log('🔍 [DualControl] test_id:', testId, 'sessionId:', sessionId)

  const commonProps = {
    dualSessionId,
    sessionId,
    onUpdatePatient: () => {},
    onSaveResponse: () => {},
  }

  switch (testId) {
    case 'bdi2':
      return <Bdi2Control {...commonProps} displayReady={true} />
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
            <p className="text-yellow-700">Test no soportado: {testId}</p>
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