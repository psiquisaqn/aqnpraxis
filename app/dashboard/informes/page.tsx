'use client'
// app/dashboard/informes/page.tsx
// FIX INFORMES (400): La query usaba profiles:patient_id(full_name) — un join
// a la tabla profiles. Pero informes.patient_id apunta a patients, no profiles.
// Supabase devuelve 400 porque no existe esa foreign key.
// Solución: cambiar a patients:patient_id(full_name).

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

  useEffect(() => {
    const loadReports = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // FIX: patients:patient_id(full_name) en vez de profiles:patient_id(full_name)
      const { data: informes, error } = await supabase
        .from('informes')
        .select(`
          id,
          session_id,
          patient_id,
          test_id,
          titulo,
          puntaje_total,
          nivel,
          recomendaciones,
          created_at,
          patients:patient_id(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando informes:', error)
        setLoading(false)
        return
      }

      const testNames: Record<string, string> = {
        peca: 'PECA - Conducta Adaptativa',
        bdi2: 'BDI-II - Depresión',
        coopersmith: 'Coopersmith SEI - Autoestima'
      }

      const formatted: Report[] = (informes ?? []).map((i: any) => ({
        id: i.id,
        session_id: i.session_id,
        // FIX: usar patients en vez de profiles
        patient_name: i.patients?.full_name || 'Paciente',
        patient_id: i.patient_id,
        test_name: testNames[i.test_id] || i.test_id,
        date: i.created_at,
        score: i.puntaje_total || 0,
        classification: i.nivel || '',
        recomendaciones: i.recomendaciones || ''
      }))

      setReports(formatted)
      setLoading(false)
    }

    loadReports()
  }, [])

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
    switch (testId) {
      case 'peca':        return `/resultados/peca?session=${sessionId}`
      case 'bdi2':        return `/bdi2/${sessionId}/report`
      case 'coopersmith': return `/resultados/coopersmith?session=${sessionId}`
      default:            return `/dashboard`
    }
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
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
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
              { key: 'date_asc',  label: 'Fecha ↑ (más antigua)' },
              { key: 'date_desc', label: 'Fecha ↓ (más reciente)' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as typeof sortBy)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
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
              <div className="flex-1">
                <div className="font-medium text-gray-800">{report.patient_name}</div>
                <div className="text-sm text-gray-500">{report.test_name}</div>
                <div className="text-xs text-gray-400">{new Date(report.date).toLocaleDateString()}</div>
                {report.recomendaciones && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{report.recomendaciones.substring(0, 100)}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-blue-600">{report.score}</div>
                <div className="text-xs text-gray-400">{report.classification}</div>
              </div>
              <Link
                href={getTestPath(
                  report.test_name.includes('PECA') ? 'peca' :
                  report.test_name.includes('BDI') ? 'bdi2' : 'coopersmith',
                  report.session_id
                )}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
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
