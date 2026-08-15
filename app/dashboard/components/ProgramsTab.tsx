'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProgramProgress } from '@/lib/supabase/activities'
import type { ProgramCode } from '@/lib/supabase/activities'
import { PDPI_SESSIONS, TPCREM_SESSIONS, POSMAN_SESSION } from '@/lib/activities/all-sessions'

const programList: { code: ProgramCode; label: string; totalSessions: number }[] = [
  { code: 'PDPI', label: 'PDPI', totalSessions: PDPI_SESSIONS.length },
  { code: 'TP-CREM', label: 'TP-CREM', totalSessions: TPCREM_SESSIONS.length },
  { code: 'POSMAN', label: 'POSMAN', totalSessions: 1 }, // POSMAN_SESSION es una sesión única
]

interface Props {
  patientId: string
}

export function ProgramsTab({ patientId }: Props) {
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<Record<ProgramCode, any>>({
    PDPI: null,
    'TP-CREM': null,
    POSMAN: null,
  })

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true)
      const results: Record<ProgramCode, any> = {
        PDPI: null,
        'TP-CREM': null,
        POSMAN: null,
      }
      for (const p of programList) {
        try {
          const prog = await getProgramProgress(patientId, p.code)
          results[p.code] = prog
        } catch (error) {
          console.error(`Error fetching progress for ${p.code}:`, error)
          results[p.code] = null
        }
      }
      setProgressData(results)
      setLoading(false)
    }

    if (patientId) {
      fetchProgress()
    }
  }, [patientId])

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando programas...</div>
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Programas de intervención</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programList.map((prog) => {
          const progress = progressData[prog.code]
          const completed = progress?.sessions_completed || 0
          const total = prog.totalSessions
          const avg = progress?.avg_achievement
          const lastSession = progress?.last_session

          return (
            <Link
              key={prog.code}
              href={`/dashboard/paciente/${patientId}/actividades/${prog.code}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">{prog.label}</span>
                <span className="text-sm text-gray-500">{completed} / {total} sesiones</span>
              </div>
              {/* Barra de progreso */}
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min((completed / total) * 100, 100)}%` }}
                />
              </div>
              {avg !== null && avg !== undefined && (
                <p className="text-xs text-gray-500 mt-2">Logro promedio: {avg.toFixed(1)} / 6</p>
              )}
              {lastSession !== null && lastSession !== undefined && (
                <p className="text-xs text-gray-400">Última sesión: {lastSession}</p>
              )}
              {completed === total && total > 0 && (
                <p className="text-xs text-green-600 mt-1">✅ Completado</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}