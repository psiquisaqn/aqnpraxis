'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SessionsTab } from './SessionsTab'
import { ProgramsTab } from './ProgramsTab'
import { ReportsTab } from './ReportsTab'
import { deleteSession } from './actions'
import { EditPatientModal } from './EditPatientModal'
import { NewSessionModal } from '@/app/dashboard/components/NewSessionModal'

const GENDER_LABEL: Record<string, string> = {
  M: 'Masculino', F: 'Femenino', NB: 'No binario', NS: 'No especifica',
}

interface Props {
  patientId: string
}

const TABS = [
  { key: 'sessions', label: 'Evaluaciones' },
  { key: 'programs', label: 'Intervenciones' },
  { key: 'reports',  label: 'Informes' },
]

export function PatientDetailClient({ patientId }: Props) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sessions' | 'programs' | 'reports'>('sessions')
  const [editOpen, setEditOpen] = useState(false)
  const [newSessionOpen, setNewSessionOpen] = useState(false)

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const res = await fetch(`/api/patients/${patientId}?psychologist_id=${user.id}`)
    if (!res.ok) { setLoading(false); return }
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [patientId])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--teal-500)', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!data) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm" style={{ color: 'var(--stone-500)' }}>Paciente no encontrado</p>
    </div>
  )

  const { patient, sessions, reports, activities } = data

  const birth = new Date(patient.birth_date)
  const now = new Date()
  let ageY = now.getFullYear() - birth.getFullYear()
  let ageM = now.getMonth() - birth.getMonth()
  if (ageM < 0) { ageY--; ageM += 12 }

  const completedSessions = sessions.filter((s: any) => s.status === 'completed').length

  return (
    <>
      <div className="px-8 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--stone-400)' }}>
          <a href="/dashboard" className="hover:underline" style={{ color: 'var(--stone-500)' }}>Pacientes</a>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: 'var(--stone-700)' }}>{patient.full_name}</span>
        </nav>

        {/* Header ficha */}
        <div className="rounded-2xl border p-6 mb-6" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold"
              style={{ background: 'var(--stone-100)', color: 'var(--stone-600)' }}>
              {patient.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--stone-900)' }}>
                    {patient.full_name}
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--stone-500)' }}>
                    {ageY} aÃ±os {ageM} meses
                    {patient.gender && ` Â· ${GENDER_LABEL[patient.gender] ?? patient.gender}`}
                    {patient.grade && ` Â· ${patient.grade}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setNewSessionOpen(true)}
                    className="text-sm font-medium px-4 py-2 rounded-xl text-white"
                    style={{ background: 'var(--teal-600)' }}>
                    + Nueva evaluaciÃ³n
                  </button>
                  <button onClick={() => setEditOpen(true)}
                    className="text-sm font-medium px-4 py-2 rounded-xl border"
                    style={{ color: 'var(--stone-600)', borderColor: 'var(--stone-200)', background: 'white' }}>
                    Editar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'RUT',           value: patient.rut ?? 'â€”' },
                  { label: 'Nacimiento',    value: new Date(patient.birth_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  { label: 'Establecimiento', value: patient.school ?? 'â€”' },
                  { label: 'Ciudad',        value: patient.city ?? 'Chile' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs" style={{ color: 'var(--stone-400)' }}>{item.label}</p>
                    <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--stone-700)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--stone-100)' }}>
                {[
                  { label: 'Evaluaciones', value: sessions.length },
                  { label: 'Completadas',  value: completedSessions },
                  { label: 'Informes',     value: reports.length },
                ].map((s) => (
                  <div key={s.label} className="flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold" style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-serif)' }}>{s.value}</span>
                    <span className="text-xs" style={{ color: 'var(--stone-400)' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {patient.notes && (
                <div className="mt-4 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--stone-50)', color: 'var(--stone-600)', border: '1px solid var(--stone-100)' }}>
                  <span className="font-medium text-xs uppercase tracking-wide" style={{ color: 'var(--stone-400)' }}>Notas Â· </span>
                  {patient.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--stone-100)' }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: tab === t.key ? 'white' : 'transparent',
                color: tab === t.key ? 'var(--stone-800)' : 'var(--stone-500)',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.label}
              {t.key === 'sessions' && sessions.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--stone-100)', color: 'var(--stone-500)' }}>
                  {sessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'sessions' && <SessionsTab sessions={sessions} patientId={patient.id} onDelete={async (sessionId) => { await deleteSession(sessionId, patient.id); await loadData() }} />}
        {tab === 'programs' && (
          <ProgramsTab
            patientId={patient.id}
            activities={activities}
            onRefresh={loadData}
          />
        )}
        {tab === 'reports' && <ReportsTab reports={reports} />}
      </div>

      <EditPatientModal patient={patient} open={editOpen} onClose={() => { setEditOpen(false); loadData() }} />
      <NewSessionModal patientId={newSessionOpen ? patient.id : null} onClose={() => setNewSessionOpen(false)} />
    </>
  )
}
