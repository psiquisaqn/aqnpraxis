'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface Entrevista {
  id: string
  fecha: string
  hora: string
  asistentes: string | null
  motivacion_principal: string | null
  created_at: string
}

interface Props {
  patientId: string
}

export function EntrevistasTab({ patientId }: Props) {
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('entrevistas')
        .select('id, fecha, hora, asistentes, motivacion_principal, created_at')
        .eq('patient_id', patientId)
        .order('fecha', { ascending: false })

      if (!error && data) {
        setEntrevistas(data)
      }
      setLoading(false)
    }
    load()
  }, [patientId, supabase])

  if (loading) return <div className="text-sm text-gray-500">Cargando entrevistas...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">Entrevistas realizadas</h3>
        <Link
          href={`/dashboard/paciente/${patientId}/entrevista/nueva`}
          className="text-sm text-blue-600 hover:underline"
        >
          + Nueva entrevista
        </Link>
      </div>

      {entrevistas.length === 0 ? (
        <p className="text-sm text-gray-400">No hay entrevistas registradas.</p>
      ) : (
        <div className="space-y-2">
          {entrevistas.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(e.fecha).toLocaleDateString('es-CL')} a las {e.hora}
                </p>
                {e.motivacion_principal && (
                  <p className="text-xs text-gray-500 truncate max-w-md">
                    {e.motivacion_principal}
                  </p>
                )}
              </div>
              <Link
                href={`/dashboard/informes/entrevista/${e.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Ver detalle
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}