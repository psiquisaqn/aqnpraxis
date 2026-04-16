'use client'

import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Patient } from '@/types'
import { PatientCard } from './PatientCard'
import { NewPatientModal } from './NewPatientModal'
import { NewSessionModal } from './NewSessionModal'
import { calcAge } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  patients: Patient[]
}

export default function PatientList({ patients: initialPatients }: Props) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [search, setSearch] = useState('')
  const [newPatientOpen, setNewPatientOpen] = useState(false)
  const [sessionPatientId, setSessionPatientId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch(`/api/patients?psychologist_id=${user.id}`)
      if (!res.ok) return
      const data = await res.json()

      const mapped = data.map((p: any) => {
        const sessions = (p.sessions ?? []) as any[]
        const sorted = sessions.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const age = calcAge(p.birth_date)
        return {
          ...p,
          age_years: age.years,
          age_months: age.months,
          session_count: sessions.length,
          latest_session: sorted[0] ?? null,
          sessions: undefined,
        }
      })
      setPatients(mapped)
    }
    load()
  }, [])

  const filtered = useMemo(
    () => patients.filter((p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.rut && p.rut.includes(search)) ||
      (p.school && p.school.toLowerCase().includes(search.toLowerCase()))
    ),
    [patients, search]
  )

  const handlePatientCreated = async () => {
    setNewPatientOpen(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch(`/api/patients?psychologist_id=${user.id}`)
    if (!res.ok) return
    const data = await res.json()
    const mapped = data.map((p: any) => {
      const sessions = (p.sessions ?? []) as any[]
      const sorted = sessions.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const age = calcAge(p.birth_date)
      return {
        ...p,
        age_years: age.years,
        age_months: age.months,
        session_count: sessions.length,
        latest_session: sorted[0] ?? null,
        sessions: undefined,
      }
    })
    setPatients(mapped)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar paciente..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => setNewPatientOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
          Nuevo paciente
        </button>
        <Link
          href="/sala"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1a6 6 0 100 12A6 6 0 007 1zM7 5v4M5 7h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Sala de Pacientes
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState search={search} onNew={() => setNewPatientOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((p) => (
            <PatientCard key={p.id} patient={p} onNewSession={(id) => setSessionPatientId(id)} />
          ))}
        </div>
      )}

      <NewPatientModal open={newPatientOpen} onClose={handlePatientCreated} />
      <NewSessionModal patientId={sessionPatientId} onClose={() => setSessionPatientId(null)} />
    </>
  )
}

function EmptyState({ search, onNew }: { search: string; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gray-100">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM3 24c0-5.2 4.925-9 11-9s11 3.8 11 9"
            stroke="gray" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      </div>
      {search ? (
        <>
          <p className="text-sm font-medium text-gray-700">
            No se encontraron resultados para "{search}"
          </p>
          <p className="text-xs mt-1 text-gray-400">
            Prueba con otro nombre, RUT o establecimiento
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">
            Aún no tienes pacientes registrados
          </p>
          <p className="text-xs mt-1 mb-5 text-gray-400">
            Agrega tu primer paciente para comenzar
          </p>
          <button 
            onClick={onNew} 
            className="text-sm font-medium px-5 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            + Agregar paciente
          </button>
        </>
      )}
    </div>
  )
}