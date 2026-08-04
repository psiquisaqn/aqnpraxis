'use client'

import { useState } from 'react'
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
  onPatientDeleted?: (id: string) => void // opcional para actualizar lista padre
}

export function PatientList({ patients, onPatientClick, onPatientDeleted }: PatientListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se dispare el click en la fila

    if (!confirm('¿Estás seguro de eliminar a este paciente? Esto eliminará todas sus sesiones e informes asociados. Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(patientId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Primero eliminar las sesiones asociadas (opcional, depende de tu schema con ON DELETE CASCADE)
      // Si tienes ON DELETE CASCADE en la BD, no necesitas hacerlo manualmente.
      // Pero por seguridad, podemos intentar eliminar el paciente directamente.
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('psychologist_id', user.id)

      if (error) throw error

      // Notificar al padre para que actualice la lista (si se pasa la prop)
      if (onPatientDeleted) {
        onPatientDeleted(patientId)
      } else {
        // Si no hay callback, recargar la página para refrescar la lista
        window.location.reload()
      }
    } catch (err: any) {
      alert('Error al eliminar el paciente: ' + err.message)
    } finally {
      setDeletingId(null)
    }
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
          onClick={() => onPatientClick(patient.id)}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{patient.full_name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-0.5">
              {patient.rut && <span>RUT: {patient.rut}</span>}
              {patient.birth_date && <span>Nac.: {new Date(patient.birth_date).toLocaleDateString('es-CL')}</span>}
              {patient.school && <span>Colegio: {patient.school}</span>}
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(patient.id, e)}
            disabled={deletingId === patient.id}
            className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 shrink-0"
          >
            {deletingId === patient.id ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      ))}
    </div>
  )
}