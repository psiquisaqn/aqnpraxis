'use client'

import { useState, useTransition, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

const GRADES = [
  'Pre-Kínder', 'Kínder',
  '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
]

interface PatientData {
  id: string
  full_name: string
  rut?: string
  birth_date: string
  gender?: string
  school?: string
  grade?: string
  city?: string
  notes?: string
}

interface Props {
  patient: PatientData
  open: boolean
  onClose: () => void
}

export function EditPatientModal({ patient, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      supabase      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('No autenticado'); return }

      const payload = {
        psychologist_id: user.id,
        full_name:  formData.get('full_name') as string,
        rut:        (formData.get('rut') as string) || null,
        birth_date: formData.get('birth_date') as string,
        gender:     (formData.get('gender') as string) || null,
        school:     (formData.get('school') as string) || null,
        grade:      (formData.get('grade') as string) || null,
        city:       (formData.get('city') as string) || 'Chile',
        notes:      (formData.get('notes') as string) || null,
      }

      const res = await fetch('/api/patients/' + patient.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 animate-fade-in"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg animate-fade-up rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'white', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--stone-100)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-serif)' }}>
            Editar paciente
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--stone-400)', background: 'var(--stone-50)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          <Field label="Nombre completo *" name="full_name" type="text" defaultValue={patient.full_name} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="RUT" name="rut" type="text" defaultValue={patient.rut} placeholder="12.345.678-9" />
            <Field label="Fecha de nacimiento *" name="birth_date" type="date" defaultValue={patient.birth_date} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>Género</label>
              <select name="gender" defaultValue={patient.gender ?? ''} className="w-full px-3 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }}>
                <option value="">No especifica</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="NB">No binario</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>Curso</label>
              <select name="grade" defaultValue={patient.grade ?? ''} className="w-full px-3 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }}>
                <option value="">— Sin especificar —</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <Field label="Establecimiento" name="school" type="text" defaultValue={patient.school} placeholder="Ej. Colegio San Francisco" />
          <Field label="Ciudad" name="city" type="text" defaultValue={patient.city ?? 'Chile'} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>Notas</label>
            <textarea name="notes" rows={3} defaultValue={patient.notes ?? ''} className="w-full px-3 py-2.5 rounded-xl text-sm border resize-none" style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }} />
          </div>
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border font-medium" style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-600)', background: 'white' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: isPending ? 'var(--stone-300)' : 'var(--teal-600)' }}>
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, type, defaultValue, placeholder, required }: {
  label: string; name: string; type: string
  defaultValue?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>{label}</label>
      <input name={name} type={type} defaultValue={defaultValue ?? ''} placeholder={placeholder} required={required}
        className="w-full px-3 py-2.5 rounded-xl text-sm border transition-all"
        style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }} />
    </div>
  )
}
