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
  
  console.log('🔍 [PAGE] Iniciando DualControlPage con ID:', dualSessionId)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [testId, setTestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderKey, setRenderKey] = useState(0)

  useEffect(() => {
    console.log('🔄 [PAGE] useEffect ejecutándose con dualSessionId:', dualSessionId)
    
    const loadDualSession = async () => {
      console.log('📡 [PAGE] Cargando dual_session...')
      
      if (!dualSessionId) {
        console.error('❌ [PAGE] No hay dualSessionId')
        setError('ID de sesión dual no válido')
        setLoading(false)
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Intentar obtener la sesión dual con más campos para depurar
      const { data, error } = await supabase
        .from('dual_sessions')
        .select('*')
        .eq('id', dualSessionId)
        .single()

      console.log('📦 [PAGE] Respuesta de dual_sessions:', { data, error })

      if (error) {
        console.error('❌ [PAGE] Error al obtener dual_session:', error)
        setError('No se pudo cargar la sesión dual.')
        setLoading(false)
        return
      }

      if (data) {
        console.log('✅ [PAGE] Datos cargados:', data)
        setSessionId(data.session_id)
        setTestId(data.test_id || 'wisc5') // fallback a wisc5 si no tiene test_id
        setRenderKey(prev => prev + 1) // Forzar re-render
      } else {
        console.error('❌ [PAGE] No se encontraron datos')
        setError('No se encontró la sesión asociada.')
      }
      setLoading(false)
    }

    loadDualSession()
  }, [dualSessionId])

  // Log adicional para depurar estado
  console.log('🖥️ [PAGE] Renderizando. Estado:', { loading, error, sessionId, testId, renderKey })

  if (loading) {
    console.log('⏳ [PAGE] Mostrando loading...')
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
    console.error('❌ [PAGE] Error o datos faltantes:', { error, sessionId, testId })
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-600">{error || 'Sesión no encontrada'}</p>
          <p className="text-xs text-gray-500 mt-2">ID: {dualSessionId}</p>
          <p className="text-xs text-gray-500">sessionId: {sessionId || 'null'}</p>
          <p className="text-xs text-gray-500">testId: {testId || 'null'}</p>
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

  console.log('🎯 [PAGE] Renderizando control para testId:', testId)

  // Propiedades comunes para todos los controles
  const commonProps = {
    dualSessionId,
    sessionId,
    onUpdatePatient: () => {
      console.log('📝 [PAGE] onUpdatePatient llamado')
    },
    onSaveResponse: () => {
      console.log('💾 [PAGE] onSaveResponse llamado')
    },
    displayReady: true, // Importante: forzar displayReady a true
  }

  // Agregar key para forzar remontaje
  const controlKey = `${testId}-${sessionId}-${renderKey}`

  // Renderizar según test_id
  switch (testId) {
    case 'bdi2':
      console.log('🟢 [PAGE] Renderizando Bdi2Control')
      return <Bdi2Control key={controlKey} {...commonProps} />
    case 'coopersmith':
      console.log('🟢 [PAGE] Renderizando CoopersmithControl')
      return <CoopersmithControl key={controlKey} {...commonProps} />
    case 'peca':
      console.log('🟢 [PAGE] Renderizando PecaControl')
      return <PecaControl key={controlKey} {...commonProps} />
    case 'wisc5':
      console.log('🟢 [PAGE] Renderizando Wisc5Control')
      return <Wisc5Control key={controlKey} {...commonProps} />
    default:
      console.warn('⚠️ [PAGE] Test no soportado:', testId)
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