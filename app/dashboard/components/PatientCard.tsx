// components/PatientCard.tsx
'use client'

import { useRouter } from 'next/navigation'

interface Patient {
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

interface Props {
  patient: Patient
  onNewSession: (patientId: string) => void
  onEdit?: () => void
}

export default function PatientCard({ patient, onNewSession, onEdit }: Props) {
  const router = useRouter()

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {/* Datos del paciente */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {patient.full_name}
            </h3>
            {patient.rut && <span className="text-xs text-gray-400">{patient.rut}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {patient.age_years > 0 && (
              <span>{patient.age_years} años {patient.age_months} meses</span>
            )}
            {patient.school && <span className="truncate max-w-[180px] sm:max-w-none">{patient.school}</span>}
            <span>Sesiones: {patient.session_count}</span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNewSession(patient.id)}
            className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Nueva sesión
          </button>
          <button
            onClick={() => router.push(`/dashboard/paciente/${patient.id}`)}
            className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Ver ficha
          </button>
          <button
            onClick={() => router.push(`/dashboard/paciente/${patient.id}/wisc5-calculadora`)}
            className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            WISC-V
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}