'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Device {
  id: string
  device_name: string
  device_type: string
}

export default function NewDualSessionPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [devices, setDevices] = useState<Device[]>([])
  const [screen1Device, setScreen1Device] = useState<string>('')
  const [screen2Device, setScreen2Device] = useState<string>('')
  const [selectedTest, setSelectedTest] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)

  supabase  const tests = [
    { id: 'coopersmith', name: 'Coopersmith SEI', description: 'Inventario de Autoestima', items: 58 },
    { id: 'bdi2', name: 'BDI-II', description: 'Inventario de Depresión de Beck', items: 21 },
    { id: 'peca', name: 'PECA', description: 'Prueba de Conducta Adaptativa', items: 45 },
    { id: 'wisc5', name: 'WISC-V', description: 'Escala de Inteligencia', items: 15 }
  ]

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  useEffect(() => {
    const loadDevices = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('devices')
        .select('id, device_name, device_type')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false })

      if (error) {
        console.error('Error loading devices:', error)
        setError('Error al cargar dispositivos')
      } else {
        setDevices(data || [])
      }
      setLoading(false)
    }

    loadDevices()
  }, [])

  const createDualSession = async () => {
    if (!selectedTest || !screen1Device || !screen2Device) return

    setCreating(true)
    setError(null)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (!user) {
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
      console.error('Error creating session:', sessionError)
      setError(`Error al crear la sesión: ${sessionError.message}`)
      setCreating(false)
      return
    }

    // Generar código de sala
    const roomCode = generateRoomCode()

    // Crear sesión dual
    const { data: dualSession, error: dualError } = await supabase
      .from('dual_sessions')
      .insert({
        session_id: session.id,
        psychologist_id: user.id,
        screen1_device_id: screen1Device,
        screen2_device_id: screen2Device,
        room_code: roomCode,
        is_active: true
      })
      .select()
      .single()

    if (dualError) {
      console.error('Error creating dual session:', dualError)
      setError(`Error al configurar la sesión dual: ${dualError.message}`)
      setCreating(false)
      return
    }

    setRoomCode(roomCode)
    
    // Esperar 2 segundos para que el psicólogo vea el código antes de redirigir
    setTimeout(() => {
      router.push(`/dual-control/${dualSession.id}`)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando dispositivos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Nueva evaluación dual</h1>
        <p className="text-gray-500 mb-6">Configura las pantallas para esta sesión</p>

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
              El paciente debe ingresar en: <span className="font-mono">aqnpraxis.vercel.app/sala</span>
            </p>
            <p className="text-xs text-green-500 mt-1">
              Redirigiendo a la pantalla de control...
            </p>
          </div>
        )}

        {/* Selección de test */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            1. Seleccionar test
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

        {/* Pantalla 1 - Paciente */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            2. Pantalla del paciente (para mostrar estímulos)
          </h2>
          <div className="space-y-2">
            {devices.map((device) => (
              <label
                key={device.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  screen1Device === device.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${roomCode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="screen1"
                  value={device.id}
                  checked={screen1Device === device.id}
                  onChange={(e) => setScreen1Device(e.target.value)}
                  disabled={!!roomCode}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-800">{device.device_name}</div>
                  <div className="text-xs text-gray-400">{device.device_type}</div>
                </div>
              </label>
            ))}
          </div>
          {devices.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-2">No tienes dispositivos registrados</p>
              <a
                href="/dashboard/dispositivos"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Ir a registrar dispositivos →
              </a>
            </div>
          )}
        </div>

        {/* Pantalla 2 - Psicólogo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
            3. Pantalla del psicólogo (control)
          </h2>
          <div className="space-y-2">
            {devices.map((device) => (
              <label
                key={device.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  screen2Device === device.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${roomCode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="screen2"
                  value={device.id}
                  checked={screen2Device === device.id}
                  onChange={(e) => setScreen2Device(e.target.value)}
                  disabled={!!roomCode}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-800">{device.device_name}</div>
                  <div className="text-xs text-gray-400">{device.device_type}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={createDualSession}
          disabled={!selectedTest || !screen1Device || !screen2Device || creating || devices.length === 0 || !!roomCode}
          className={`w-full py-3 rounded-xl font-medium transition-colors ${
            !selectedTest || !screen1Device || !screen2Device || creating || devices.length === 0 || roomCode
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {creating ? 'Creando sesión...' : roomCode ? 'Sesión creada' : 'Iniciar evaluación dual'}
        </button>
      </div>
    </div>
  )
}