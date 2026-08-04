'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Patient {
  id: string
  full_name: string
  rut: string | null
  birth_date: string | null
  school: string | null
}

interface PatientListProps {
  patients: Patient[]
  onPatientClick: (id: string) => void
  onPatientDeleted?: (id: string) => void
}

export function PatientList({ patients, onPatientClick, onPatientDeleted }: PatientListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar a este paciente? Esto eliminará todas sus sesiones e informes asociados. Esta acción no se puede deshacer.')) {
      return
    }
    setDeletingId(patientId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('psychologist_id', user.id)
      if (error) throw error
      if (onPatientDeleted) {
        onPatientDeleted(patientId)
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      alert('Error al eliminar el paciente: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleWisc5 = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/paciente/${patientId}/wisc5-calculadora`)
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        No hay pacientes registrados.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {patients.map((patient) => (
        <div
          key={patient.id}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{patient.full_name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-0.5">
              {patient.rut && <span>RUT: {patient.rut}</span>}
              {patient.birth_date && <span>Nac.: {new Date(patient.birth_date).toLocaleDateString('es-CL')}</span>}
              {patient.school && <span>Colegio: {patient.school}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onPatientClick(patient.id) }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Ver ficha
            </button>
            <button
              onClick={(e) => handleWisc5(patient.id, e)}
              className="text-purple-600 hover:text-purple-800 text-sm"
            >
              WISC‑V
            </button>
            <button
              onClick={(e) => handleDelete(patient.id, e)}
              disabled={deletingId === patient.id}
              className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
            >
              {deletingId === patient.id ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}