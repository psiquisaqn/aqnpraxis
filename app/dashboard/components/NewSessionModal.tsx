'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TESTS = [
  { id: 'wisc5_cl',    name: 'WISC-V Chile',  full: 'Escala de Inteligencia de Wechsler para Niños — 5ª Ed.', time: '~65–80 min', age: '6 a 16 años 11 meses', color: 'var(--teal-600)' },
  { id: 'peca',        name: 'PECA',           full: 'Prueba de Evaluación Cognitiva para el Aprendizaje',     time: '~30–45 min', age: 'Edad escolar',           color: '#7c3aed' },
  { id: 'beck_bdi2',   name: 'BDI-II',         full: 'Inventario de Depresión de Beck — 2ª Ed.',               time: '~10 min',    age: '≥ 13 años',              color: '#b45309' },
  { id: 'coopersmith', name: 'Coopersmith',    full: 'Inventario de Autoestima de Coopersmith',                time: '~15 min',    age: '≥ 8 años',               color: '#0369a1' },
]

interface Props {
  patientId: string | null
  onClose: () => void
}

export function NewSessionModal({ patientId, onClose }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!patientId) return null

  const handleStart = () => {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('No autenticado'); return }

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psychologist_id: user.id, patient_id: patientId, test_id: selected }),
      })
      const result = await res.json()

      if (result.error) {
        setError(result.error)
      } else {
        onClose()
        if (selected === 'peca')          router.push(`/peca/${result.sessionId}`)
        else if (selected === 'beck_bdi2')    router.push(`/bdi2/${result.sessionId}`)
        else if (selected === 'coopersmith')  router.push(`/coopersmith/${result.sessionId}`)
        else                                  router.push(`/session/${result.sessionId}`)
      }
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg animate-fade-up rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'white' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--stone-100)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-serif)' }}>
            Iniciar evaluación
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--stone-400)', background: 'var(--stone-50)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm mb-4" style={{ color: 'var(--stone-500)' }}>
            Selecciona el instrumento de evaluación:
          </p>

          <div className="space-y-2">
            {TESTS.map((t) => (
              <button key={t.id} type="button" onClick={() => setSelected(t.id)}
                className="w-full text-left rounded-xl p-4 border transition-all duration-150"
                style={{
                  borderColor: selected === t.id ? t.color : 'var(--stone-200)',
                  background:  selected === t.id ? `${t.color}08` : 'white',
                  outline:     selected === t.id ? `2px solid ${t.color}` : 'none',
                  outlineOffset: '-1px',
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
                    style={{ background: t.color }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--stone-800)' }}>{t.name}</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--stone-500)' }}>{t.full}</p>
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: 'var(--stone-400)' }}>⏱ {t.time}</span>
                      <span className="text-xs" style={{ color: 'var(--stone-400)' }}>· {t.age}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 rounded-lg px-4 py-3 text-sm"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm border font-medium"
              style={{ borderColor: 'var(--stone-200)', color: 'var(--stone-600)', background: 'white' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleStart} disabled={!selected || isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: !selected || isPending ? 'var(--stone-300)' : 'var(--teal-600)',
                cursor:     !selected || isPending ? 'not-allowed' : 'pointer',
              }}>
              {isPending ? 'Iniciando...' : 'Comenzar sesión'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
