'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
}

const GRADES = [
  'Pre-Kínder', 'Kínder',
  '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
]

export function NewPatientModal({ open, onClose }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    supabase    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('No autenticado')
      setIsPending(false)
      return
    }

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

    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await res.json()

    setIsPending(false)
    if (result.error) {
      setError(result.error)
    } else {
      formRef.current?.reset()
      onClose()
      window.location.reload()
    }
  }

  return (
    <>
      {/* Overlay — also centers the modal */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="w-full max-w-lg animate-fade-up rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ background: 'white', maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--stone-100)' }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-serif)' }}
          >
            Nuevo paciente
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--stone-400)', background: 'var(--stone-50)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Nombre */}
          <FormField label="Nombre completo *" name="full_name" type="text" placeholder="Ej. Valentina Rojas" required />

          {/* Fila: RUT + Nacimiento */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="RUT" name="rut" type="text" placeholder="12.345.678-9" />
            <FormField label="Fecha de nacimiento *" name="birth_date" type="date" required />
          </div>

          {/* Fila: Género + Grado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>
                Género
              </label>
              <select
                name="gender"
                className="w-full px-3 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }}
              >
                <option value="">No especifica</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="NB">No binario</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>
                Curso
              </label>
              <select
                name="grade"
                className="w-full px-3 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }}
              >
                <option value="">— Sin especificar —</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Establecimiento */}
          <FormField label="Establecimiento educacional" name="school" type="text" placeholder="Ej. Colegio San Francisco" />

          {/* Ciudad */}
          <FormField label="Ciudad" name="city" type="text" placeholder="Santiago" />

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>
              Notas (opcional)
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Motivo de consulta, antecedentes relevantes..."
              className="w-full px-3 py-2.5 rounded-xl text-sm border resize-none"
              style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }}
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm border font-medium transition-colors"
              style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-600)', background: 'white' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: isPending ? 'var(--stone-300)' : 'var(--teal-600)' }}
            >
              {isPending ? 'Guardando...' : 'Guardar paciente'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  )
}

function FormField({
  label, name, type, placeholder, required,
}: {
  label: string
  name: string
  type: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 rounded-xl text-sm border transition-all"
        style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-800)', background: 'white' }}
      />
    </div>
  )
}
