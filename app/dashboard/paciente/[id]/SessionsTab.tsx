'use client'

import Link from 'next/link'
import { TEST_LABELS, STATUS_LABELS } from '@/types'

interface Session {
  id: string
  test_id: string
  status: string
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  age_years?: number
  age_months?: number
  created_at: string
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  completed:   { bg: 'rgba(20,184,166,0.08)',  text: 'var(--teal-700)',  dot: 'var(--teal-500)' },
  in_progress: { bg: 'rgba(234,179,8,0.10)',   text: '#92400e',         dot: '#f59e0b' },
  scheduled:   { bg: 'rgba(99,102,241,0.08)',  text: '#3730a3',         dot: '#818cf8' },
  cancelled:   { bg: 'rgba(239,68,68,0.08)',   text: '#991b1b',         dot: '#f87171' },
}

export function SessionsTab({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--stone-100)' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="4" width="16" height="15" rx="2" stroke="var(--stone-400)" strokeWidth="1.5"/>
            <path d="M7 2v4M15 2v4M3 9h16" stroke="var(--stone-400)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--stone-600)' }}>Sin evaluaciones registradas</p>
        <p className="text-xs mt-1" style={{ color: 'var(--stone-400)' }}>Usa el botón "Nueva evaluación" para comenzar</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.scheduled
        const date = s.completed_at ?? s.started_at ?? s.created_at
        const label = TEST_LABELS[s.test_id] ?? s.test_id

        return (
          <div
            key={s.id}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all"
            style={{ background: 'white', borderColor: 'var(--stone-100)' }}
          >
            {/* Test badge */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ background: testColor(s.test_id) }}
            >
              {label.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: 'var(--stone-800)' }}>{label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: style.bg, color: style.text }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: style.dot }} />
                  {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ?? s.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs" style={{ color: 'var(--stone-400)' }}>
                  {formatDate(date)}
                </span>
                {s.age_years !== undefined && (
                  <span className="text-xs" style={{ color: 'var(--stone-400)' }}>
                    · Edad: {s.age_years}a {s.age_months}m
                  </span>
                )}
              </div>
            </div>

            {/* Acción */}
            <div className="shrink-0">
              {s.status === 'in_progress' ? (
                <Link
                  href={s.test_id === 'peca' ? `/peca/${s.id}` : `/session/${s.id}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                  style={{ background: 'var(--teal-600)' }}
                >
                  Continuar
                </Link>
              ) : s.status === 'completed' ? (
                <Link
                  href={`/session/${s.id}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                  style={{ color: 'var(--stone-600)', borderColor: 'var(--stone-200)', background: 'white' }}
                >
                  Ver resultados
                </Link>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function testColor(testId: string) {
  const map: Record<string, string> = {
    wisc5_cl:    'var(--teal-600)',
    peca:        '#7c3aed',
    beck_bdi2:   '#b45309',
    coopersmith: '#0369a1',
  }
  return map[testId] ?? 'var(--stone-500)'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
