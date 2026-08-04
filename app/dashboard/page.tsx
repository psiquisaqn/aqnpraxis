'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PatientList } from './components/PatientList'

export default function DashboardPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .eq('psychologist_id', session.user.id)
        .order('full_name')

      setPatients(patientsData || [])
    }
    load()
  }, [supabase, router])

  const handlePatientDeleted = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Pacientes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Listado de todos tus pacientes registrados.
        </p>
      </div>

      <PatientList
        patients={patients}
        onPatientClick={(id) => router.push(`/dashboard/paciente/${id}`)}
        onPatientDeleted={handlePatientDeleted}
      />
    </div>
  )
}