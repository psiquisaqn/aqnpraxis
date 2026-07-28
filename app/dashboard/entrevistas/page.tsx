'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface Entrevista {
  id: string
  fecha: string
  hora: string
  asistentes: string | null
  motivacion_principal: string | null
  created_at: string
  patient: {
    full_name: string
  } | null
}

export default function EntrevistasPage() {
  const router = useRouter()
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('No autenticado')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('entrevistas')
          .select(`
            *,
            patient:patients(full_name)
          `)
          .eq('psychologist_id', user.id)
          .order('fecha', { ascending: false })

        if (error) throw error
        setEntrevistas(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando entrevistas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Entrevistas Psicológicas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Listado de todas las entrevistas realizadas.
        </p>
      </div>

      {entrevistas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">No hay entrevistas registradas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Hora</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Paciente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Motivación principal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody>
              {entrevistas.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(e.fecha).toLocaleDateString('es-CL')}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {e.hora}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {e.patient?.full_name || 'Sin paciente'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                    {e.motivacion_principal || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/informes/entrevista/${e.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}