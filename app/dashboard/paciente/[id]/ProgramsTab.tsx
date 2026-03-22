'use client'

import { useState, useTransition } from 'react'
import { enrollProgram, completeActivitySession } from './actions'

interface ActivitySession {
  id: string
  program_code: string
  session_number: number
  status: string
  scheduled_date?: string
  completed_date?: string
}

interface Props {
  patientId: string
  activities: ActivitySession[]
}

const PROGRAMS = [
  {
    code: 'PDPI',
    name: 'PDPI',
    full: 'Programa para el Desarrollo del Pensamiento Inteligente',
    total: 59,
    color: '#7c3aed',
  },
  {
    code: 'TP-CREM',
    name: 'TP-CREM',
    full: 'Técnica Psicoterapéutica para la Conexión y Regulación Emocional',
    total: 12,
    color: '#0369a1',
  },
  {
    code: 'POSMAN',
    name: 'POSMAN',
    full: 'Ejercicios de Focalización POSMAN',
    total: 1,
    color: '#b45309',
  },
]

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  completed:   { bg: 'rgba(20,184,166,0.1)',  text: 'var(--teal-700)' },
  in_progress: { bg: 'rgba(234,179,8,0.1)',   text: '#92400e' },
  pending:     { bg: 'var(--stone-100)',       text: 'var(--stone-500)' },
  skipped:     { bg: 'rgba(239,68,68,0.08)',  text: '#991b1b' },
}

const STATUS_LABEL: Record<string, string> = {
  completed:   'Completada',
  in_progress: 'En curso',
  pending:     'Pendiente',
  skipped:     'Omitida',
}

export function ProgramsTab({ patientId, activities }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const byProgram = (code: string) => activities.filter((a) => a.program_code === code)
  const isEnrolled = (code: string) => byProgram(code).length > 0

  const handleEnroll = (code: string) => {
    setEnrollError(null)
    startTransition(async () => {
      const result = await enrollProgram(patientId, code)
      if (result.error) setEnrollError(result.error)
      else setExpanded(code)
    })
  }

  const handleComplete = (sessionId: string) => {
    startTransition(async () => {
      await completeActivitySession(sessionId, patientId)
    })
  }

  return (
    <div className="space-y-4">
      {enrollError && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
          {enrollError}
        </div>
      )}

      {PROGRAMS.map((prog) => {
        const enrolled = isEnrolled(prog.code)
        const sessions = byProgram(prog.code)
        const completed = sessions.filter((s) => s.status === 'completed').length
        const pct = enrolled ? Math.round((completed / prog.total) * 100) : 0
        const open = expanded === prog.code

        return (
          <div key={prog.code} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--stone-200)', background: 'white' }}>
            {/* Header del programa */}
            <div className="px-5 py-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: prog.color }}
              >
                {prog.code.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--stone-800)' }}>{prog.name}</span>
                  {enrolled && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--teal-700)' }}>
                      Inscrito
                    </span>
                  )}
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--stone-500)' }}>{prog.full}</p>

                {enrolled && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: prog.color }}
                      />
                    </div>
                    <span className="text-xs shrink-0" style={{ color: 'var(--stone-500)' }}>
                      {completed}/{prog.total}
                    </span>
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {!enrolled ? (
                  <button
                    onClick={() => handleEnroll(prog.code)}
                    disabled={isPending}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-all"
                    style={{ background: isPending ? 'var(--stone-300)' : prog.color }}
                  >
                    Inscribir
                  </button>
                ) : (
                  <button
                    onClick={() => setExpanded(open ? null : prog.code)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
                    style={{ color: 'var(--stone-600)', borderColor: 'var(--stone-200)' }}
                  >
                    {open ? 'Cerrar' : 'Ver sesiones'}
                  </button>
                )}
              </div>
            </div>

            {/* Lista de sesiones expandida */}
            {enrolled && open && (
              <div className="border-t px-5 py-4" style={{ borderColor: 'var(--stone-100)', background: 'var(--stone-50)' }}>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {sessions.map((s) => {
                    const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.pending
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: 'white', border: '1px solid var(--stone-100)' }}
                      >
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {s.session_number}
                        </span>
                        <span className="text-xs flex-1" style={{ color: 'var(--stone-600)' }}>
                          Sesión {s.session_number}
                          {s.completed_date && (
                            <span style={{ color: 'var(--stone-400)' }}>
                              {' '}· {new Date(s.completed_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: style.bg, color: style.text }}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </span>
                        {s.status === 'pending' && (
                          <button
                            onClick={() => handleComplete(s.id)}
                            disabled={isPending}
                            className="text-xs px-2 py-1 rounded-lg text-white shrink-0 transition-all"
                            style={{ background: prog.color }}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
