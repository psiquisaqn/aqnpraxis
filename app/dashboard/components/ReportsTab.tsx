'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface Informe {
  id: string
  test_id: string
  puntaje_total: number | null
  nivel: string | null
  created_at: string
}

interface Props {
  patientId: string
}

export function ReportsTab({ patientId }: Props) {
  const [informes, setInformes] = useState<Informe[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('informes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setInformes(data)
      }
      setLoading(false)
    }
    load()
  }, [patientId, supabase])

  if (loading) return <div className="text-sm text-gray-500">Cargando informes...</div>

  const testLabels: Record<string, string> = {
    bdi2: 'BDI-II (Depresión)',
    coopersmith: 'Coopersmith (Autoestima)',
    peca: 'PECA (Conducta Adaptativa)',
    wisc5: 'WISC-V (Inteligencia)',
    entrevista: 'Entrevista Psicológica',
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Informes generados</h3>
      {informes.length === 0 ? (
        <p className="text-sm text-gray-400">No hay informes generados.</p>
      ) : (
        <div className="space-y-2">
          {informes.map((i) => (
            <div key={i.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {testLabels[i.test_id] || i.test_id}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(i.created_at).toLocaleDateString('es-CL')}
                  {i.puntaje_total !== null && ` | Puntaje: ${i.puntaje_total}`}
                </p>
              </div>
              <Link
                href={i.test_id === 'entrevista' 
                  ? `/dashboard/informes/entrevista/${i.id}` 
                  : `/resultados/${i.test_id}?session=${i.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Ver informe
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}