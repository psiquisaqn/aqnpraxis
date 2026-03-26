'use client'

import { useState, useEffect } from 'react'

interface Device {
  id: string
  device_name: string
  device_type: string
  device_brand: string
  last_seen: string
  created_at: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceName, setDeviceName] = useState('')
  const [deviceType, setDeviceType] = useState('laptop')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectCurrentDevice = () => {
    const userAgent = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
      return 'tablet'
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return 'phone'
    }
    return 'laptop'
  }

  const loadDevices = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/devices')
      if (!res.ok) {
        throw new Error('Error al cargar dispositivos')
      }
      const data = await res.json()
      setDevices(data)
    } catch (err) {
      console.error(err)
      setError('Error al cargar dispositivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
    
    // Sugerir nombre basado en dispositivo actual
    const type = detectCurrentDevice()
    setDeviceType(type)
    setDeviceName(`${navigator.platform || 'dispositivo'} - ${type}`)
  }, [])

  const addDevice = async () => {
    if (!deviceName.trim()) return
    
    setSaving(true)
    setError(null)
    
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_name: deviceName.trim(),
          device_type: deviceType,
          device_brand: navigator.platform || 'desconocido'
        })
      })
      
      if (!res.ok) {
        throw new Error('Error al registrar dispositivo')
      }
      
      const data = await res.json()
      setDevices([data, ...devices])
      setDeviceName('')
      const type = detectCurrentDevice()
      setDeviceType(type)
      setDeviceName(`${navigator.platform || 'dispositivo'} - ${type}`)
    } catch (err) {
      console.error(err)
      setError('Error al registrar dispositivo')
    } finally {
      setSaving(false)
    }
  }

  const removeDevice = async (deviceId: string) => {
    setError(null)
    
    try {
      const res = await fetch(`/api/devices?id=${deviceId}`, { method: 'DELETE' })
      
      if (!res.ok) {
        throw new Error('Error al eliminar dispositivo')
      }
      
      setDevices(devices.filter(d => d.id !== deviceId))
    } catch (err) {
      console.error(err)
      setError('Error al eliminar dispositivo')
    }
  }

  const updateLastSeen = async (deviceId: string) => {
    try {
      await fetch(`/api/devices/lastseen?id=${deviceId}`, { method: 'PUT' })
    } catch (err) {
      // Silencioso, no es crítico
    }
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
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Mis dispositivos</h1>
      <p className="text-gray-500 mb-6">Registra los dispositivos que usas para evaluaciones duales</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Registrar nuevo dispositivo
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nombre del dispositivo (ej: iPad consultorio)"
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
            disabled={!deviceName.trim() || saving}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Registrando...' : 'Registrar'}
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
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            onMouseEnter={() => updateLastSeen(device.id)}
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
              <p className="text-xs text-gray-300 mt-0.5">
                Registrado: {new Date(device.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => removeDevice(device.id)}
              className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
          <p className="text-xs text-gray-300 mt-1">Registra tu primer dispositivo para usar evaluación dual</p>
        </div>
      )}
    </div>
  )
}