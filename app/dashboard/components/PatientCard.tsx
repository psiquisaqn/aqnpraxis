'use client'

import Link from 'next/link'

// Definir la interfaz aquí mismo (sin importar de otro lugar)
interface PatientCardProps {
  patient: {
    id: string
    full_name: string
    rut?: string
    birth_date?: string
    gender?: string
    school?: string
    age_years: number
    age_months: number
    session_count: number
    latest_session: {
      id: string
      test_id: string
      status: string
      created_at: string
      completed_at?: string | null
    } | null
  }
  onNewSession: (patientId: string) => void
}

export function PatientCard({ patient, onNewSession }: PatientCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{patient.full_name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-0.5">
            {patient.rut && <span>RUT: {patient.rut}</span>}
            {patient.age_years !== undefined && (
              <span>Edad: {patient.age_years} años {patient.age_months} meses</span>
            )}
            {patient.school && <span>{patient.school}</span>}
          </div>
          {patient.latest_session && (
            <div className="mt-1 text-xs text-gray-400">
              Última sesión: {new Date(patient.latest_session.created_at).toLocaleDateString()}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100">
                {patient.latest_session.status === 'completed' ? 'Completada' : 'En curso'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón "Ingresar WISC-V" */}
          <Link
            href={`/dashboard/paciente/${patient.id}/wisc5-calculadora`}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Ingresar WISC-V
          </Link>

          <button
            onClick={() => onNewSession(patient.id)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Nueva sesión
          </button>
        </div>
      </div>
    </div>
  )
}