'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface Informe {
  id: string
  session_id: string | null
  patient_id: string
  test_id: string
  puntaje_total: number | null
  nivel: string | null
  recomendaciones: string | null
  tipo: string | null
  created_at: string
  patient: {
    full_name: string
    rut: string | null
  } | null
}

export default function InformesPage() {
  const router = useRouter()
  const [informes, setInformes] = useState<Informe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadInformes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No autenticado')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('informes')
        .select('*, patient:patients(full_name, rut), tipo')
        .eq('psychologist_id', user.id)
        .in('test_id', ['bdi2', 'coopersmith', 'peca', 'wisc5'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setInformes(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInformes()
  }, [])

  const handleDelete = async (reportId: string) => {
    if (!confirm('¿Estás seguro de eliminar este informe? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(reportId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('informes')
        .delete()
        .eq('id', reportId)
        .eq('psychologist_id', user.id)

      if (error) throw error

      setInformes(prev => prev.filter(r => r.id !== reportId))
      setDeletingId(null)
    } catch (err: any) {
      alert('Error al eliminar el informe: ' + err.message)
      setDeletingId(null)
    }
  }

  const formatScore = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-'
    const fixed = Number(value).toFixed(1)
    return fixed.replace(/\.0$/, '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando informes...</p>
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

  const testLabels: Record<string, string> = {
    bdi2: 'BDI-II (Depresión)',
    coopersmith: 'Coopersmith (Autoestima)',
    peca: 'PECA (Conducta Adaptativa)',
    wisc5: 'WISC-V (Inteligencia)',
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Informes generados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Listado de todos los informes de tests generados para tus pacientes.
        </p>
      </div>

      {informes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">No hay informes generados aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {/* Acción ahora es la primera columna */}
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Acción</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Paciente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Test</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Puntaje</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nivel</th>
                </tr>
              </thead>
              <tbody>
                {informes.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Celda de acción ahora primero */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/resultados/${report.test_id}?session=${report.session_id}&type=${report.tipo || 'brief'}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => handleDelete(report.id)}
                          disabled={deletingId === report.id}
                          className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                        >
                          {deletingId === report.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString('es-CL')}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {report.patient?.full_name || 'Sin paciente'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {testLabels[report.test_id] || report.test_id}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatScore(report.puntaje_total)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {report.nivel || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}