'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import PatientCard from '@/app/dashboard/components/PatientCard'
import { SessionsTab } from '@/app/dashboard/components/SessionsTab'
import { ProgramsTab } from '@/app/dashboard/components/ProgramsTab'
import { EntrevistasTab } from '@/app/dashboard/components/EntrevistasTab'
import { calcAge } from '@/lib/utils'

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params?.id as string

  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'evaluaciones' | 'programas' | 'entrevistas'>('evaluaciones')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!patientId) return

    const loadPatient = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        const { data, error } = await supabase
          .from('patients')
          .select(`
            *,
            sessions (
              id,
              test_id,
              status,
              created_at,
              completed_at
            )
          `)
          .eq('id', patientId)
          .eq('psychologist_id', user.id)
          .single()

        if (error) throw error
        if (!data) throw new Error('Paciente no encontrado')

        const age = data.birth_date ? calcAge(data.birth_date) : null

        setPatient({
          ...data,
          age_years: age?.years || 0,
          age_months: age?.months || 0,
          sessions: data.sessions || [],
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPatient()
  }, [patientId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando paciente...</p>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error || 'Paciente no encontrado'}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  // Pestañas actualizadas: sin "Informes", "Sesiones" → "Evaluaciones"
  const tabs = [
    { id: 'evaluaciones', label: 'Evaluaciones' },
    { id: 'programas', label: 'Programas' },
    { id: 'entrevistas', label: 'Entrevistas' },
  ]

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Tarjeta del paciente - responsiva */}
      <div className="mb-6">
        <PatientCard patient={patient} onNewSession={() => {}} />
      </div>

      {/* Navegación de pestañas - responsive con scroll horizontal en móvil */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border border-b-0 border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de pestañas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {activeTab === 'evaluaciones' && <SessionsTab patientId={patient.id} />}
        {activeTab === 'programas' && <ProgramsTab patientId={patient.id} />}
        {activeTab === 'entrevistas' && <EntrevistasTab patientId={patient.id} />}
      </div>
    </div>
  )
}