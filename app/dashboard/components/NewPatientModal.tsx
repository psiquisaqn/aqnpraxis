'use client'

import { useState, useTransition, useRef } from 'react'
import { createPatient } from '@/app/dashboard/actions'

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
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createPatient(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        onClose()
      }
    })
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg animate-fade-up rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}
        style={{ background: 'white' }}
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
