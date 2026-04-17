'use client'

import Link from 'next/link'

// Definir tipos localmente para evitar conflictos
interface LocalSession {
  id: string
  test_id: string
  status: string
  completed_at?: string | null
}

interface LocalPatient {
  id: string
  full_name: string
  rut?: string
  birth_date?: string
  gender?: string
  school?: string
  age_years: number
  age_months: number
  session_count: number
  latest_session: LocalSession | null
}

interface Props {
  patient: LocalPatient
  onNewSession: (patientId: string) => void
}

// Definiciones locales
const TEST_LABELS: Record<string, string> = {
  coopersmith: 'Coopersmith SEI',
  bdi2: 'BDI-II',
  peca: 'PECA',
  wisc5: 'WISC-V',
  wisc5_cl: 'WISC-V',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completada',
  in_progress: 'En curso',
  scheduled: 'Agendada',
  cancelled: 'Cancelada',
  completed_brief: 'Finalizado (breve)',
  completed_extended: 'Finalizado (extendido)',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed:   { bg: '#EFF6FF',  text: '#3B82F6' },
  in_progress: { bg: '#FEF3C7',  text: '#D97706' },
  scheduled:   { bg: '#EFF6FF',  text: '#3B82F6' },
  cancelled:   { bg: '#FEE2E2',  text: '#DC2626' },
  completed_brief: { bg: '#D1FAE5', text: '#059669' },
  completed_extended: { bg: '#D1FAE5', text: '#059669' },
}

const GENDER_ICON: Record<string, string> = {
  M:  '♂',
  F:  '♀',
  NB: '⚧',
  NS: '·',
}

export function PatientCard({ patient, onNewSession }: Props) {
  const s = patient.latest_session
  const statusColor = s ? STATUS_COLORS[s.status] : null
  const statusLabel = s ? (STATUS_LABELS[s.status] || s.status) : null

  return (
    <div className="group bg-white rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
      {/* Cabecera */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm bg-gray-100 text-gray-700">
              {patient.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate leading-tight text-gray-800">
                {patient.full_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-500">
                  {patient.age_years} a {patient.age_months} m
                </span>
                {patient.gender && (
                  <span className="text-xs text-gray-400">
                    · {GENDER_ICON[patient.gender]}
                  </span>
                )}
                {patient.school && (
                  <span className="text-xs text-gray-400 truncate max-w-[120px]">
                    · {patient.school}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {patient.session_count ?? 0} ses.
            </span>
          </div>
        </div>

        {/* Última sesión */}
        {s ? (
          <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-700">
                {TEST_LABELS[s.test_id] ?? s.test_id}
              </span>
              {statusColor && statusLabel && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: statusColor.bg, color: statusColor.text }}
                >
                  {statusLabel}
                </span>
              )}
            </div>
            {s.status === 'in_progress' && (
              <Link
                href={`/session/${s.id}`}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Continuar →
              </Link>
            )}
            {(s.status === 'completed_brief' || s.status === 'completed_extended') && (
              <Link
                href={`/resultados/wisc5?session=${s.id}&type=${s.status === 'completed_brief' ? 'brief' : 'extended'}`}
                className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                Ver informe →
              </Link>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-400">
            Sin evaluaciones registradas
          </p>
        )}
      </div>

      {/* Acciones - 3 botones */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onNewSession(patient.id)}
            className="text-xs font-medium py-2 px-1 rounded-lg transition-all duration-150 text-white bg-blue-600 hover:bg-blue-700 text-center"
          >
            + Nueva evaluación
          </button>
          <Link
            href={`/dashboard/agenda?patient=${patient.id}&new=true`}
            className="flex items-center justify-center text-xs font-medium py-2 px-1 rounded-lg border border-green-200 text-green-600 bg-white hover:bg-green-50 transition-colors text-center"
          >
            📅 Agendar
          </Link>
          <Link
            href={`/dashboard/paciente/${patient.id}`}
            className="flex items-center justify-center text-xs font-medium py-2 px-1 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors text-center"
          >
            Ver ficha
          </Link>
        </div>
      </div>
    </div>
  )
}