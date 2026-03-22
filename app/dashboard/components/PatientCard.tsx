'use client'

import Link from 'next/link'
import type { Patient } from '@/types'
import { TEST_LABELS, STATUS_LABELS } from '@/types'

interface Props {
  patient: Patient
  onNewSession: (patientId: string) => void
}

const STATUS_COLORS = {
  completed:   { bg: 'rgba(20,184,166,0.1)',  text: 'var(--teal-700)' },
  in_progress: { bg: 'rgba(234,179,8,0.12)',   text: '#854d0e' },
  scheduled:   { bg: 'rgba(99,102,241,0.1)',   text: '#4338ca' },
  cancelled:   { bg: 'rgba(239,68,68,0.1)',    text: '#991b1b' },
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
    <div
      className="group bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
      style={{ borderColor: 'var(--stone-200)' }}
    >
      {/* Cabecera */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar inicial */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm"
              style={{
                background: 'var(--stone-100)',
                color: 'var(--stone-700)',
              }}
            >
              {patient.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-sm truncate leading-tight"
                style={{ color: 'var(--stone-800)' }}
              >
                {patient.full_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs" style={{ color: 'var(--stone-500)' }}>
                  {patient.age_years} a {patient.age_months} m
                </span>
                {patient.gender && (
                  <span className="text-xs" style={{ color: 'var(--stone-400)' }}>
                    · {GENDER_ICON[patient.gender as keyof typeof GENDER_ICON]}
                  </span>
                )}
                {patient.school && (
                  <span
                    className="text-xs truncate max-w-[100px]"
                    style={{ color: 'var(--stone-400)' }}
                  >
                    · {patient.school}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contador de sesiones */}
          <div className="shrink-0 text-right">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'var(--stone-100)', color: 'var(--stone-600)' }}
            >
              {patient.session_count ?? 0} ses.
            </span>
          </div>
        </div>

        {/* Última sesión */}
        {s ? (
          <div
            className="mt-3 flex items-center justify-between rounded-xl px-3 py-2"
            style={{ background: 'var(--stone-50)', border: '1px solid var(--stone-100)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--stone-700)' }}
              >
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
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--teal-600)' }}
              >
                Continuar →
              </Link>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs" style={{ color: 'var(--stone-400)' }}>
            Sin evaluaciones registradas
          </p>
        )}
      </div>

      {/* Acciones */}
      <div
        className="px-5 py-3 flex items-center gap-2 border-t"
        style={{ borderColor: 'var(--stone-100)', background: 'var(--stone-50)' }}
      >
        <button
          onClick={() => onNewSession(patient.id)}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg transition-all duration-150 text-white"
          style={{ background: 'var(--teal-600)' }}
        >
          + Nueva evaluación
        </button>
        <Link
          href={`/dashboard/paciente/${patient.id}`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150"
          style={{
            color: 'var(--stone-600)',
            borderColor: 'var(--stone-200)',
            background: 'white',
          }}
        >
          Ver ficha
        </Link>
      </div>
    </div>
  )
}
