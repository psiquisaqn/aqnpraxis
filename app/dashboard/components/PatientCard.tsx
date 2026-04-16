'use client'

import Link from 'next/link'
import type { Patient } from '@/types'
import { TEST_LABELS, STATUS_LABELS } from '@/types'

interface Props {
  patient: Patient
  onNewSession: (patientId: string) => void
}

const STATUS_COLORS = {
  completed:   { bg: '#EFF6FF',  text: '#3B82F6' },
  in_progress: { bg: '#FEF3C7',  text: '#D97706' },
  scheduled:   { bg: '#EFF6FF',  text: '#3B82F6' },
  cancelled:   { bg: '#FEE2E2',  text: '#DC2626' },
}

const GENDER_ICON = {
  M:  '♂',
  F:  '♀',
  NB: '⚧',
  NS: '·',
}

export function PatientCard({ patient, onNewSession }: Props) {
  const s = patient.latest_session
  const statusColor = s ? STATUS_COLORS[s.status] : null

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
                    · {GENDER_ICON[patient.gender as keyof typeof GENDER_ICON]}
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
              {statusColor && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: statusColor.bg, color: statusColor.text }}
                >
                  {STATUS_LABELS[s.status]}
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
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-400">
            Sin evaluaciones registradas
          </p>
        )}
      </div>

      {/* Acciones - diseño responsivo (3 columnas en desktop) */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link
            href={`/dashboard/paciente/${patient.id}/nueva-sesion-dual`}
            className="text-xs font-medium py-2 px-1 rounded-lg transition-all duration-150 text-white bg-blue-600 hover:bg-blue-700 text-center whitespace-nowrap"
          >
            + Nueva evaluación
          </Link>
          <Link
            href={`/dashboard/agenda?patient=${patient.id}&new=true`}
            className="text-xs font-medium py-2 px-1 rounded-lg border border-green-200 text-green-600 bg-white hover:bg-green-50 transition-colors text-center whitespace-nowrap"
          >
            📅 Agendar
          </Link>
          <Link
            href={`/dashboard/paciente/${patient.id}`}
            className="text-xs font-medium py-2 px-1 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors text-center whitespace-nowrap"
          >
            Ver ficha
          </Link>
        </div>
      </div>
    </div>
  )
}