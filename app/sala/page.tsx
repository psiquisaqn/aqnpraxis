'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function SalaPage() {
  const params = useParams()
  const code = params.code as string

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
    const loadSession = async () => {
      try {
        console.log('=== BUSCANDO SALA POR CÓDIGO ===')
        console.log('Código:', code)

        // Buscar la sesión dual por código de sala
        const { data: dualData, error: dualError } = await supabase
          .from('dual_sessions')
          .select('*')
          .eq('room_code', code.toUpperCase())
          .eq('is_active', true)
          .single()

        if (dualError) {
          console.error('Error finding dual session:', dualError)
          setError('Sala no encontrada. Verifica el código e intenta nuevamente.')
          setLoading(false)
          return
        }

        console.log('Dual session encontrada:', dualData)
        setDualSession(dualData)

        // Obtener la sesión relacionada
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', dualData.session_id)
          .single()

        if (sessionError) {
          console.error('Error loading session:', sessionError)
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

    if (code) {
      loadSession()
    }
  }, [code, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Buscando sala...</p>
        </div>
      </div>
    )
  }

  if (error || !dualSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Sala no encontrada</h2>
          <p className="text-yellow-600 mb-4">
            {error || 'El código ingresado no es válido o la sesión ya expiró.'}
          </p>
          <a
            href="/sala"
            className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Intentar nuevamente
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Evaluación Psicológica
          </h1>
          <p className="text-gray-600">
            Sala: <span className="font-mono font-bold">{code}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Test: {session?.test_id || 'Cargando...'}
          </p>
        </div>

        {/* Contenido de la evaluación */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Bienvenido a la evaluación
            </h2>
            <p className="text-gray-500 mb-4">
              Estás conectado a la sala de evaluación.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg inline-block">
              <p className="text-sm text-blue-700">
                Esperando que el psicólogo inicie la evaluación...
              </p>
            </div>
          </div>
        </div>

        {/* Botón para salir */}
        <div className="mt-6 text-center">
          <a
            href="/sala"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Cambiar de sala
          </a>
        </div>
      </div>
    </div>
  )
}
