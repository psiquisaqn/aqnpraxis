'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

export default function ConfiguracionPage() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null)
  const [institucionNombre, setInstitucionNombre] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    const { data, error } = await supabase
      .from('config_institucion')
      .select('*')
      .single()
    
    if (data && !error) {
      setLogoUrl(data.logo_url)
      setFirmaUrl(data.firma_url)
      setInstitucionNombre(data.institucion_nombre || '')
    }
    setLoading(false)
  }

  const uploadImage = async (file: File, tipo: 'logo' | 'firma') => {
    if (!file) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${tipo}_${Date.now()}.${fileExt}`
    const filePath = `config/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('institucion')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('institucion')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSaving(true)
    const url = await uploadImage(file, 'logo')
    if (url) setLogoUrl(url)
    setSaving(false)
  }

  const handleFirmaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSaving(true)
    const url = await uploadImage(file, 'firma')
    if (url) setFirmaUrl(url)
    setSaving(false)
  }

  const saveConfig = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('config_institucion')
      .upsert({
        logo_url: logoUrl,
        firma_url: firmaUrl,
        institucion_nombre: institucionNombre,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      setMessage('Error al guardar: ' + error.message)
    } else {
      setMessage('Configuración guardada correctamente')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Configuración de Informes</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Logo institucional</h2>
        <div className="mb-4">
          {logoUrl ? (
            <div className="mb-3">
              <Image src={logoUrl} alt="Logo" width={150} height={80} className="object-contain" />
              <button
                onClick={() => setLogoUrl(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Eliminar logo
              </button>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-3">No hay logo configurado</p>
          )}
          <label className="block">
            <span className="sr-only">Seleccionar logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Firma profesional</h2>
        <div className="mb-4">
          {firmaUrl ? (
            <div className="mb-3">
              <Image src={firmaUrl} alt="Firma" width={200} height={60} className="object-contain" />
              <button
                onClick={() => setFirmaUrl(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Eliminar firma
              </button>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-3">No hay firma configurada</p>
          )}
          <label className="block">
            <span className="sr-only">Seleccionar firma</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFirmaChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </label>
          <p className="text-xs text-gray-400 mt-2">La firma debe ser una imagen PNG con fondo transparente.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Datos institucionales</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la institución
          </label>
          <input
            type="text"
            value={institucionNombre}
            onChange={(e) => setInstitucionNombre(e.target.value)}
            placeholder="Ej: Centro de Psicología Aplicada"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={saveConfig}
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </div>
  )
}