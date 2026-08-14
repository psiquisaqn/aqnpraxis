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
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-3"
        >
          {/* Información del paciente - arriba en móvil */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 text-base sm:text-lg truncate">
              {patient.full_name}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-0.5">
              {patient.rut && <span>RUT: {patient.rut}</span>}
              {patient.birth_date && <span>Nac.: {new Date(patient.birth_date).toLocaleDateString('es-CL')}</span>}
              {patient.school && <span className="truncate max-w-[120px] sm:max-w-none">Colegio: {patient.school}</span>}
            </div>
          </div>

          {/* Botones - abajo en móvil, a la derecha en desktop */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={(e) => { e.stopPropagation(); onPatientClick(patient.id) }}
              className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Ver ficha
            </button>
            <button
              onClick={(e) => handleWisc5(patient.id, e)}
              className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              WISC‑V
            </button>
            <button
              onClick={(e) => handleDelete(patient.id, e)}
              disabled={deletingId === patient.id}
              className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {deletingId === patient.id ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}