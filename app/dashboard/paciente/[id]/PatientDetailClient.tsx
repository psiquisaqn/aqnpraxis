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

  const { patient
