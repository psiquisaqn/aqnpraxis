'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Device {
  id: string
  device_name: string
  device_type: string
}

export default function DualSetupPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const patientId = params.id as string

  const [devices, setDevices] = useState<Device[]>([])
  const [screen1Device, setScreen1Device] = useState<string>('')
  const [screen2Device, setScreen2Device] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const loadDevices = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('devices')
        .select('id, device_name, device_type')
        .eq('user_id', user.id)

      if (data) setDevices(data)
      setLoading(false)
    }

    loadDevices()
  }, [])

  const startDualSession = async () => {
    if (!screen1Device || !screen2Device) return

    setSaving(true)

    // Crear dual session
    const { data: dualSession, error } = await supabase
      .from('dual_sessions')
      .insert({
        session_id: sessionId,
        psychologist_id: (await supabase.auth.getUser()).data.user?.id,
        screen1_device_id: screen1Device,
        screen2_device_id: screen2Device,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setSaving(false)
      return
    }

    // Redirigir al control de pantalla dual
    router.push(`/dashboard/paciente/${patientId}/session/${sessionId}/dual-control/${dualSession.id}`)
  }

  if (loading) return <div className="p-8 text-center">Cargando dispositivos...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Configurar pantallas duales</h1>
      <p className="text-gray-500 mb-6">
        Selecciona qué dispositivo usará el paciente (pantalla 1) y cuál usará el psicólogo (pantalla 2)
      </p>

      <div className="space-y-6">
        {/* Pantalla 1 - Paciente */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Pantalla 1 · Paciente
          </h2>
          <div className="space-y-2">
            {devices.map((device) => (
              <label
                key={device.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  screen1Device === device.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="screen1"
                  value={device.id}
                  checked={screen1Device === device.id}
                  onChange={(e) => setScreen1Device(e.target.value)}
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

        {/* Pantalla 2 - Psicólogo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Pantalla 2 · Psicólogo (control)
          </h2>
          <div className="space-y-2">
            {devices.map((device) => (
              <label
                key={device.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  screen2Device === device.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="screen2"
                  value={device.id}
                  checked={screen2Device === device.id}
                  onChange={(e) => setScreen2Device(e.target.value)}
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
          onClick={startDualSession}
          disabled={!screen1Device || !screen2Device || saving}
          className={`w-full py-3 rounded-xl font-medium transition-colors ${
            !screen1Device || !screen2Device || saving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Iniciando...' : 'Iniciar sesión dual'}
        </button>
      </div>
    </div>
  )
}