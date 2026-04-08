'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function Bdi2ReportPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: score, error } = await supabase
        .from('bdi2_scores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (error || !score) { setLoading(false); return }
      setData(score)

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

  const severityColors: Record<string, string> = {
    minima: 'bg-green-50 text-green-700',
    leve: 'bg-yellow-50 text-yellow-700',
    moderada: 'bg-orange-50 text-orange-700',
    grave: 'bg-red-50 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Inventario de Depresion de Beck (BDI-II)</h1>
              <p className="text-gray-500 mt-1">Paciente: {patient?.full_name || 'Sin nombre'}</p>
              <p className="text-gray-400 text-sm">Fecha: {data.calculated_at ? new Date(data.calculated_at).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}</p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
              Volver al dashboard
            </button>
          </div>

          <div className={"rounded-xl p-6 mb-6 text-center " + (severityColors[data.severity] || 'bg-blue-50 text-blue-700')}>
            <p className="text-sm mb-1">Puntaje Total</p>
            <p className="text-5xl font-bold">{data.total_score}</p>
            <p className="text-lg font-medium mt-2">{data.severity_label}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cognitivo-Afectivo', value: data.cognitive_affective_score },
              { label: 'Somatico-Motivacional', value: data.somatic_motivational_score },
              { label: 'Ideacion Suicida', value: data.suicidal_ideation_score },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
