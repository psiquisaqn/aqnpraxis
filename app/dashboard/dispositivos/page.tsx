'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Device {
  id: string
  device_name: string
  device_type: string
  device_brand: string
  last_seen: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceName, setDeviceName] = useState('')
  const [deviceType, setDeviceType] = useState('laptop')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const detectCurrentDevice = () => {
    const userAgent = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
      return 'tablet'
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return 'phone'
    }
    return 'laptop'
  }

  useEffect(() => {
    const loadDevices = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false })

      if (data) setDevices(data)
      setLoading(false)
    }

    loadDevices()
    
    // Sugerir nombre basado en dispositivo actual
    const type = detectCurrentDevice()
    setDeviceType(type)
    setDeviceName(`${navigator.platform || 'dispositivo'} - ${type}`)
  }, [])

  const addDevice = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !deviceName) return

    const { data } = await supabase
      .from('devices')
      .insert({
        user_id: user.id,
        device_name: deviceName,
        device_type: deviceType,
        device_brand: navigator.platform || 'desconocido'
      })
      .select()
      .single()

    if (data) {
      setDevices([data, ...devices])
      setDeviceName('')
    }
  }

  const removeDevice = async (deviceId: string) => {
    await supabase.from('devices').delete().eq('id', deviceId)
    setDevices(devices.filter(d => d.id !== deviceId))
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Mis dispositivos</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Registrar nuevo dispositivo
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nombre del dispositivo (ej: iPad de consultorio)"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
          >
            <option value="laptop">Laptop</option>
            <option value="tablet">Tablet</option>
            <option value="phone">Teléfono</option>
            <option value="desktop">Desktop</option>
          </select>
          <button
            onClick={addDevice}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Registrar
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Dispositivo detectado: {detectCurrentDevice()}
        </p>
      </div>

      <div className="space-y-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{device.device_name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {device.device_type}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {device.device_brand} · Último uso: {new Date(device.last_seen).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => removeDevice(device.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📱</div>
          <p className="text-gray-400">No tienes dispositivos registrados</p>
          <p className="text-xs text-gray-300 mt-1">Registra tu primer dispositivo para comenzar</p>
        </div>
      )}
    </div>
  )
}