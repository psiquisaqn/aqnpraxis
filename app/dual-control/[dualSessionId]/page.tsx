'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Wisc5Control } from './wisc5'
import { Bdi2Control } from './bdi2'
import { CoopersmithControl } from './coopersmith'
import { PecaControl } from './peca'

export default function DualControlPage() {
  console.log('🔍 [DualControl] Renderizando componente...')
  
  const params = useParams()
  console.log('🔍 [DualControl] params:', params)
  
  const dualSessionId = params.dualSessionId as string
  console.log('🔍 [DualControl] dualSessionId:', dualSessionId)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [testId, setTestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 [DualControl] useEffect ejecutándose...')
    
    const loadDualSession = async () => {
      console.log('🔍 [DualControl] loadDualSession iniciado')
      
      if (!dualSessionId) {
        console.error('❌ [DualControl] dualSessionId es falsy')
        setError('ID de sesión dual no válido')
        setLoading(false)
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      console.log('🔍 [DualControl] Consultando dual_sessions...')
      
      const { data, error } = await supabase
        .from('dual_sessions')
        .select('session_id, test_id')
        .eq('id', dualSessionId)
        .single()

      if (error) {
        console.error('❌ [DualControl] Error al obtener dual_session:', error)
        setError('No se pudo cargar la sesión dual.')
        setLoading(false)
        return
      }

      console.log('🔍 [DualControl] data recibido:', data)

      if (data?.session_id) {
        setSessionId(data.session_id)
        setTestId(data.test_id)
        console.log('✅ [DualControl] sessionId:', data.session_id, 'testId:', data.test_id)
      } else {
        console.error('❌ [DualControl] No hay session_id en data')
        setError('No se encontró la sesión asociada.')
      }
      setLoading(false)
    }

    loadDualSession()
  }, [dualSessionId])

  // Log en cada renderizado
  console.log('🔍 [DualControl] Estado actual:', { loading, error, sessionId, testId })

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
    console.error('❌ [DualControl] Error o datos faltantes:', { error, sessionId, testId })
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-600">{error || 'Sesión no encontrada'}</p>
          <p className="text-xs text-red-400 mt-2">sessionId: {sessionId || 'null'}, testId: {testId || 'null'}</p>
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

  console.log('✅ [DualControl] Renderizando componente para testId:', testId)

  const commonProps = {
    dualSessionId,
    sessionId,
    onUpdatePatient: () => {},
    onSaveResponse: () => {},
  }

  switch (testId) {
    case 'bdi2':
      console.log('🟢 [DualControl] Renderizando Bdi2Control')
      return <Bdi2Control {...commonProps} displayReady={true} />
    case 'coopersmith':
      console.log('🟢 [DualControl] Renderizando CoopersmithControl')
      return <CoopersmithControl {...commonProps} />
    case 'peca':
      console.log('🟢 [DualControl] Renderizando PecaControl')
      return <PecaControl {...commonProps} />
    case 'wisc5':
      console.log('🟢 [DualControl] Renderizando Wisc5Control')
      return <Wisc5Control {...commonProps} />
    default:
      console.error('❌ [DualControl] Test no soportado:', testId)
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