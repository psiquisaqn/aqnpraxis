'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function NewDualSessionPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [selectedTest, setSelectedTest] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)

  const tests = [
    { id: 'coopersmith', name: 'Coopersmith SEI', description: 'Inventario de Autoestima', items: 58 },
    { id: 'bdi2', name: 'BDI-II', description: 'Inventario de Depresión de Beck', items: 21 },
    { id: 'peca', name: 'PECA', description: 'Prueba de Conducta Adaptativa', items: 45 },
  ]

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const createDualSession = async () => {
    if (!selectedTest) {
      setError('Por favor, selecciona un test')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Usuario no autenticado')
        setCreating(false)
        return
      }

      // Crear sesión normal
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          patient_id: patientId,
          psychologist_id: user.id,
          test_id: selectedTest,
          status: 'in_progress'
        })
        .select()
        .single()

      if (sessionError) {
        setError(`Error al crear la sesión: ${sessionError.message}`)
        setCreating(false)
        return
      }

      // Generar código de sala
      const roomCode = generateRoomCode()

      // Crear sesión dual (sin dispositivos)
      const { data: dualSession, error: dualError } = await supabase
        .from('dual_sessions')
        .insert({
          session_id: session.id,
          psychologist_id: user.id,
          room_code: roomCode,
          is_active: true
        })
        .select()
        .single()

      if (dualError) {
        setError(`Error al configurar la sesión dual: ${dualError.message}`)
        setCreating(false)
        return
      }

      setRoomCode(roomCode)
      
      setTimeout(() => {
        router.push(`/dual-control/${dualSession.id}`)
      }, 2000)
      
    } catch (err: any) {
      console.error('Error inesperado:', err)
      setError(`Error inesperado: ${err.message}`)
      setCreating(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header fijo */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <h1 className="text-xl font-semibold text-gray-800 mt-2">Nueva evaluación dual</h1>
        <p className="text-gray-500 text-sm">Selecciona el test para comenzar</p>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {roomCode && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-700 mb-1">✅ Sesión dual creada con éxito</p>
              <p className="text-xs text-green-600 mb-2">Comparte este código con el paciente:</p>
              <p className="text-3xl font-mono font-bold tracking-wider text-green-800 bg-white inline-block px-6 py-2 rounded-lg border border-green-200">
                {roomCode}
              </p>
              <p className="text-xs text-green-500 mt-2">
                El paciente debe ingresar en: <span className="font-mono">/sala</span>
              </p>
              <p className="text-xs text-green-500 mt-1">
                Redirigiendo a la pantalla de control...
              </p>
            </div>
          )}

          {/* Selección de test */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Seleccionar test
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => setSelectedTest(test.id)}
                  disabled={!!roomCode}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedTest === test.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${roomCode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium text-gray-800">{test.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{test.description}</div>
                  <div className="text-xs text-gray-400 mt-2">{test.items} ítems</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Botón fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-10">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={createDualSession}
            disabled={!selectedTest || creating || !!roomCode}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              !selectedTest || creating || roomCode
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {creating ? 'Creando sesión...' : roomCode ? 'Sesión creada' : 'Iniciar evaluación dual'}
          </button>
        </div>
      </div>
    </div>
  )
}