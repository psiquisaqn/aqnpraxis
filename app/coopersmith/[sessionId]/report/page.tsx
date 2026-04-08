'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function CoopersmithReportPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Cargar score
      const { data: score, error } = await supabase
        .from('coopersmith_scores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (error || !score) { setLoading(false); return }
      setData(score)

      // Cargar paciente via session
      const { data: session } = await supabase
        .from('sessions')
        .select('patient:patients(full_name, birth_date)')
        .eq('id', sessionId)
        .single()

      if (session?.patient) setPatient(session.patient)
      setLoading(false)
    }
    load()
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">No se encontraron resultados.</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Volver al dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Inventario de Autoestima de Coopersmith</h1>
              <p className="text-gray-500 mt-1">Paciente: {patient?.full_name || 'Sin nombre'}</p>
              <p className="text-gray-400 text-sm">Fecha: {data.calculated_at ? new Date(data.calculated_at).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}</p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
              Volver al dashboard
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 mb-6 text-center">
            <p className="text-sm text-blue-600 mb-1">Puntaje Total</p>
            <p className="text-5xl font-bold text-blue-700">{data.total_scaled}</p>
            <p className="text-lg font-medium text-blue-600 mt-2">{data.level_label}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'General', value: data.score_general },
              { label: 'Social', value: data.score_social },
              { label: 'Hogar', value: data.score_hogar },
              { label: 'Escolar', value: data.score_escolar },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          {data.lie_scale_invalid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-700">Escala de mentira elevada � interpretar con cautela.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
