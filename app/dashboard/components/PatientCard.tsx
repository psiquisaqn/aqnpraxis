'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
}

export default function PatientCard({ patient, onNewSession }: Props) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada'
      case 'in_progress':
        return 'En progreso'
      default:
        return status
    }
  }

  const testLabels: Record<string, string> = {
    bdi2: 'BDI-II',
    coopersmith: 'Coopersmith',
    peca: 'PECA',
    wisc5: 'WISC-V',
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Columna izquierda: nombre y datos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-800 truncate">
              {patient.full_name}
            </h3>
            {patient.rut && (
              <span className="text-xs text-gray-400">{patient.rut}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {patient.age_years > 0 && (
              <span>
                {patient.age_years} años {patient.age_months} meses
              </span>
            )}
            {patient.school && (
              <span className="truncate max-w-[150px]">{patient.school}</span>
            )}
            <span>Sesiones: {patient.session_count}</span>
          </div>
          {patient.latest_session && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400">Última sesión:</span>
              <span className="text-gray-600">
                {format(new Date(patient.latest_session.created_at), "d 'de' MMMM", { locale: es })}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.latest_session.status)}`}>
                {getStatusLabel(patient.latest_session.status)}
              </span>
              <span className="text-gray-400">
                {testLabels[patient.latest_session.test_id] || patient.latest_session.test_id}
              </span>
            </div>
          )}
        </div>

        {/* Columna derecha: botones de acción */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNewSession(patient.id)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Nueva sesión
          </button>
          <button
            onClick={() => router.push(`/dashboard/paciente/${patient.id}`)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Ver ficha
          </button>
          {/* Botón para WISC-V */}
          <button
            onClick={() => router.push(`/dashboard/paciente/${patient.id}/wisc5-calculadora`)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            WISC-V
          </button>
        </div>
      </div>
    </div>
  )
}