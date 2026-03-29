'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Report {
  id: string
  patient_name: string
  test_name: string
  date: string
  score: number
  classification: string
  session_id: string
}

export default function InformesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc')
  supabase  useEffect(() => {
    const loadReports = async () => {
      // Obtener sesiones completadas con datos de pacientes y tests
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          created_at,
          test_id,
          patient:patients(full_name),
          coopersmith_scores!left(total_scaled, level_label),
          bdi2_scores!left(total_score, severity),
          peca_scores!left(participation_level)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      const formatted: Report[] = sessions.map((s: any) => {
        let score = 0
        let classification = ''
        let testName = ''

        switch (s.test_id) {
          case 'coopersmith':
            testName = 'Coopersmith SEI'
            score = s.coopersmith_scores?.total_scaled || 0
            classification = s.coopersmith_scores?.level_label || ''
            break
          case 'bdi2':
            testName = 'BDI-II'
            score = s.bdi2_scores?.total_score || 0
            classification = s.bdi2_scores?.severity || ''
            break
          case 'peca':
            testName = 'PECA'
            score = Math.round((s.peca_scores?.participation_level || 0) * 100)
            classification = score >= 75 ? 'Buen nivel' : 'Requiere apoyos'
            break
          default:
            testName = s.test_id
        }

        return {
          id: s.id,
          patient_name: s.patient?.full_name || 'Paciente eliminado',
          test_name: testName,
          date: s.created_at,
          score,
          classification,
          session_id: s.id
        }
      })

      setReports(formatted)
      setLoading(false)
    }

    loadReports()
  }, [])

  const sortedReports = [...reports].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.patient_name.localeCompare(b.patient_name)
      case 'name_desc':
        return b.patient_name.localeCompare(a.patient_name)
      case 'date_asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case 'date_desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      default:
        return 0
    }
  })

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
          ← Volver al dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortBy('name_asc')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'name_asc' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Nombre A-Z
            </button>
            <button
              onClick={() => setSortBy('name_desc')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'name_desc' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Nombre Z-A
            </button>
            <button
              onClick={() => setSortBy('date_asc')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'date_asc' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Fecha ↑ (más antigua)
            </button>
            <button
              onClick={() => setSortBy('date_desc')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'date_desc' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Fecha ↓ (más reciente)
            </button>
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
              </div>
              <div className="text-right">
                <div className="font-semibold text-blue-600">{report.score}</div>
                <div className="text-xs text-gray-400">{report.classification}</div>
              </div>
              <Link
                href={`/resultados/${report.session_id.includes('coopersmith') ? 'coopersmith' : report.session_id.includes('bdi2') ? 'bdi2' : 'peca'}?session=${report.session_id}`}
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