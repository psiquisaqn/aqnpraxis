'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function NuevaEntrevistaPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patientName, setPatientName] = useState('')

  // Campos del formulario
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [asistentes, setAsistentes] = useState('')
  const [motivacionPrincipal, setMotivacionPrincipal] = useState('')
  const [infoRelevante, setInfoRelevante] = useState('')
  const [sugerenciasAcuerdos, setSugerenciasAcuerdos] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Cargar datos del paciente
  useEffect(() => {
    if (!patientId) return

    const loadPatient = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', patientId)
        .single()

      if (error) {
        console.error('Error cargando paciente:', error)
        setError('No se pudo cargar la información del paciente.')
      } else if (data) {
        setPatientName(data.full_name)
      }
      setLoading(false)
    }

    loadPatient()
  }, [patientId, supabase])

  // Establecer fecha y hora actual por defecto
  useEffect(() => {
    const now = new Date()
    const fechaStr = now.toISOString().split('T')[0]
    const horaStr = now.toTimeString().slice(0, 5)
    setFecha(fechaStr)
    setHora(horaStr)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fecha || !hora) {
      setError('La fecha y hora son obligatorias.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      console.log('🔍 [Entrevista] Enviando a API...')

      // 1. Insertar entrevista usando la API Route (evita problemas de RLS)
      const response = await fetch('/api/entrevistas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          fecha,
          hora,
          asistentes: asistentes.trim() || null,
          motivacion_principal: motivacionPrincipal.trim() || null,
          info_relevante: infoRelevante.trim() || null,
          sugerencias_acuerdos: sugerenciasAcuerdos.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ [Entrevista] Error en API:', data)
        throw new Error(data.error || 'Error al guardar la entrevista')
      }

      console.log('✅ [Entrevista] Entrevista insertada con ID:', data.id)

      // 2. Insertar en informes (se hace desde el cliente porque ya funciona)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error: informesError } = await supabase
        .from('informes')
        .insert({
          patient_id: patientId,
          psychologist_id: user.id,
          session_id: data.id,
          test_id: 'entrevista',
          puntaje_total: null,
          nivel: null,
          recomendaciones: 'Entrevista psicológica',
          created_at: new Date().toISOString(),
        })

      if (informesError) {
        console.error('❌ [Entrevista] Error al insertar en informes:', informesError)
        throw informesError
      }

      console.log('✅ [Entrevista] Registro en informes creado correctamente.')

      // 3. Redirigir al detalle de la entrevista
      router.push(`/dashboard/informes/entrevista/${data.id}`)
    } catch (err: any) {
      console.error('❌ [Entrevista] Error general:', err)
      setError(err.message || 'Error al guardar la entrevista')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Nueva Entrevista Psicológica</h1>
            <p className="text-sm text-gray-500 mt-1">
              Paciente: <span className="font-medium text-gray-700">{patientName || 'Cargando...'}</span>
            </p>
          </div>
          <button
            onClick={() => router.push(`/dashboard/paciente/${patientId}`)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fila: Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Asistentes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asistentes
            </label>
            <input
              type="text"
              value={asistentes}
              onChange={(e) => setAsistentes(e.target.value)}
              placeholder="Ej: Madre, padre, apoderado, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Motivación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivación o Inquietud Principal
            </label>
            <textarea
              value={motivacionPrincipal}
              onChange={(e) => setMotivacionPrincipal(e.target.value)}
              rows={4}
              placeholder="Describe la razón principal de la consulta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            />
          </div>

          {/* Información relevante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Información Relevante
            </label>
            <textarea
              value={infoRelevante}
              onChange={(e) => setInfoRelevante(e.target.value)}
              rows={4}
              placeholder="Antecedentes, historia clínica, contexto familiar/educativo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            />
          </div>

          {/* Sugerencias y acuerdos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sugerencias y Acuerdos
            </label>
            <textarea
              value={sugerenciasAcuerdos}
              onChange={(e) => setSugerenciasAcuerdos(e.target.value)}
              rows={4}
              placeholder="Acuerdos con el paciente/familia, sugerencias, derivaciones, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/paciente/${patientId}`)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar entrevista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}