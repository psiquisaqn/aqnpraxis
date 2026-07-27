'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface Session {
  id: string
  test_id: string
  status: string
  created_at: string
  completed_at: string | null
}

interface Props {
  patientId: string
}

export function SessionsTab({ patientId }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSessions(data)
      }
      setLoading(false)
    }
    load()
  }, [patientId, supabase])

  if (loading) return <div className="text-sm text-gray-500">Cargando sesiones...</div>

  const testLabels: Record<string, string> = {
    bdi2: 'BDI-II (Depresión)',
    coopersmith: 'Coopersmith (Autoestima)',
    peca: 'PECA (Conducta Adaptativa)',
    wisc5: 'WISC-V (Inteligencia)',
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Sesiones del paciente</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400">No hay sesiones registradas.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {testLabels[s.test_id] || s.test_id}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(s.created_at).toLocaleDateString('es-CL')}
                  {s.status === 'completed' && ' ✅ Completada'}
                </p>
              </div>
              <Link
                href={`/resultados/${s.test_id}?session=${s.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Ver resultados
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}