'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface DualSession {
  id: string
  session_id: string
  room_code: string
  is_active: boolean
}

interface Session {
  id: string
  patient_id: string
  test_id: string
  status: string
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
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== CARGANDO SESIÓN DUAL ===')
        console.log('DualSessionId:', dualSessionId)

        // Obtener la sesión dual
        const { data: dualData, error: dualError } = await supabase
          .from('dual_sessions')
          .select('*')
          .eq('id', dualSessionId)
          .single()

        if (dualError) {
          console.error('Error loading dual session:', dualError)
          setError(`Error al cargar sesión dual: ${dualError.message}`)
          setLoading(false)
          return
        }

        console.log('Dual session loaded:', dualData)
        setDualSession(dualData)

        // Obtener la sesión relacionada
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', dualData.session_id)
          .single()

        if (sessionError) {
          console.error('Error loading session:', sessionError)
          setError(`Error al cargar sesión: ${sessionError.message}`)
        } else {
          console.log('Session loaded:', sessionData)
          setSession(sessionData)
        }

        setLoading(false)
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setError(`Error inesperado: ${err.message}`)
        setLoading(false)
      }
    }

    if (dualSessionId) {
      loadData()
    }
  }, [dualSessionId, supabase])

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-700 font-semibold mb-2">Error:</h2>
          <p className="text-red-600">{error}</p>
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

  if (!dualSession || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-yellow-700 font-semibold mb-2">Sesión no encontrada</h2>
          <p className="text-yellow-600">No se pudo encontrar la sesión dual solicitada.</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Control de Evaluación Dual</h1>
              <p className="text-gray-600 mt-1">
                Sesión de control para el psicólogo
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Código de sala:</div>
              <div className="text-2xl font-mono font-bold text-blue-600">{dualSession.room_code}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Control */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Panel de Control</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Información de la sesión</p>
                <p className="text-xs text-blue-600 mt-1">
                  Test: {session.test_id}
                </p>
                <p className="text-xs text-blue-600">
                  Estado: {session.status}
                </p>
                <p className="text-xs text-blue-600">
                  ID Sesión: {session.id}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">Instrucciones</p>
                <p className="text-xs text-gray-600 mt-1">
                  Esta es la pantalla de control del psicólogo. Aquí podrás registrar las respuestas del paciente.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  El paciente debe ingresar a: <span className="font-mono">/sala/{dualSession.room_code}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Panel de Respuestas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Respuestas</h2>
            <div className="space-y-2">
              <p className="text-gray-500 text-center py-8">
                Aquí aparecerán las respuestas registradas durante la evaluación.
              </p>
            </div>
          </div>
        </div>

        {/* Botón para volver */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            ← Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
