'use client'
// app/dashboard/informes/page.tsx
// FIX #2: Agregar botón "Eliminar informe" con confirmación en cada tarjeta.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

interface Report {
  id: string
  session_id: string
  patient_name: string
  patient_id: string
  test_name: string
  date: string
  score: number
  classification: string
  recomendaciones: string
}

export default function InformesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabaseRef = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: informes, error } = await supabase
      .from('informes')
      .select('id, session_id, patient_id, test_id, titulo, puntaje_total, nivel, recomendaciones, created_at')
      .order('created_at', { ascending: false })

    if (error) { console.error('Error cargando informes:', error); setLoading(false); return }
    if (!informes || informes.length === 0) { setReports([]); setLoading(false); return }

    const patientIds = [...new Set(informes.map((i: any) => i.patient_id).filter(Boolean))]
    let patientMap: Record<string, string> = {}

    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name')
        .in('id', patientIds)
      if (patients) patients.forEach((p: any) => { patientMap[p.id] = p.full_name })
    }

    const testNames: Record<string, string> = {
      peca: 'PECA - Conducta Adaptativa',
      bdi2: 'BDI-II - Depresión',
      coopersmith: 'Coopersmith SEI - Autoestima',
    }

    setReports(informes.map((i: any) => ({
      id: i.id,
      session_id: i.session_id,
      patient_name: patientMap[i.patient_id] || 'Paciente',
      patient_id: i.patient_id,
      test_name: testNames[i.test_id] || i.test_id,
      date: i.created_at,
      score: i.puntaje_total || 0,
      classification: i.nivel || '',
      recomendaciones: i.recomendaciones || '',
    })))
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.from('informes').delete().eq('id', id)
    if (error) {
      console.error('Error eliminando informe:', error)
      alert('Error al eliminar el informe: ' + error.message)
    } else {
      setReports(prev => prev.filter(r => r.id !== id))
    }
    setConfirmDeleteId(null)
    setDeleting(false)
  }

  const sortedReports = [...reports].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':  return a.patient_name.localeCompare(b.patient_name)
      case 'name_desc': return b.patient_name.localeCompare(a.patient_name)
      case 'date_asc':  return new Date(a.date).getTime() - new Date(b.date).getTime()
      case 'date_desc': return new Date(b.date).getTime() - new Date(a.date).getTime()
      default: return 0
    }
  })

  const getTestPath = (testId: string, sessionId: string) => {
    if (testId.includes('PECA'))         return `/resultados/peca?session=${sessionId}`
    if (testId.includes('BDI'))          return `/bdi2/${sessionId}/report`
    if (testId.includes('Coopersmith'))  return `/resultados/coopersmith?session=${sessionId}`
    return `/dashboard`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Informes</h1>
        <Link href="/dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
          ↩ Volver al dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'name_asc',  label: 'Nombre A-Z' },
              { key: 'name_desc', label: 'Nombre Z-A' },
              { key: 'date_asc',  label: 'Fecha ↑' },
              { key: 'date_desc', label: 'Fecha ↓' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setSortBy(key as typeof sortBy)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedReports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">No hay informes disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-sm transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800">{report.patient_name}</div>
                <div className="text-sm text-gray-500">{report.test_name}</div>
                <div className="text-xs text-gray-400">{new Date(report.date).toLocaleDateString('es-CL')}</div>
                {report.recomendaciones && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{report.recomendaciones.substring(0, 100)}</div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="font-semibold text-blue-600 text-lg">{report.score}</div>
                <div className="text-xs text-gray-400">{report.classification}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={getTestPath(report.test_name, report.session_id)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors">
                  Ver informe
                </Link>

                {/* Botón eliminar con confirmación inline */}
                {confirmDeleteId === report.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
                    <button
                      onClick={() => handleDelete(report.id)}
                      disabled={deleting}
                      className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50 transition-colors">
                      {deleting ? '...' : 'Sí'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(report.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar informe">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M2 4h11M5 4V2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5V4M11.5 4l-.7 8.3a1 1 0 01-1 .9H5.2a1 1 0 01-1-.9L3.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
