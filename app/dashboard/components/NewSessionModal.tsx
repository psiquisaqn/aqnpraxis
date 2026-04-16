'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const TESTS = [
  { id: 'coopersmith', name: 'Coopersmith SEI', full: 'Inventario de Autoestima de Coopersmith', time: '~15 min', age: '≥ 8 años', color: '#0369a1' },
  { id: 'bdi2', name: 'BDI-II', full: 'Inventario de Depresión de Beck — 2ª Ed.', time: '~10 min', age: '≥ 13 años', color: '#b45309' },
  { id: 'peca', name: 'PECA', full: 'Prueba de Evaluación de Conducta Adaptativa', time: '~30-45 min', age: 'Edad escolar', color: '#7c3aed' },
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

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleStart = () => {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('No autenticado'); return }

      // Crear sesión
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          psychologist_id: user.id,
          patient_id: patientId,
          test_id: selected,
          status: 'in_progress'
        })
        .select()
        .single()

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      // Generar código de sala
      const roomCode = generateRoomCode()

      // Crear sesión dual
      const { data: dualSession, error: dualError } = await supabase
        .from('dual_sessions')
        .insert({
          session_id: session.id,
          psychologist_id: user.id,
          room_code: roomCode,
          is_active: true
        })
        .select()
        .single()

      if (dualError) {
        setError(dualError.message)
        return
      }

      onClose()
      router.push(`/dual-control/${dualSession.id}`)
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
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: '#e5e5e0' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1a1a1a', fontFamily: 'Georgia, Times New Roman, serif' }}>
            Nueva evaluación
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: '#9ca3af', background: '#f5f5f0' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            Selecciona el instrumento de evaluación:
          </p>

          <div className="space-y-2">
            {TESTS.map((t) => (
              <button key={t.id} type="button" onClick={() => setSelected(t.id)}
                className="w-full text-left rounded-xl p-4 border transition-all duration-150"
                style={{
                  borderColor:   selected === t.id ? t.color : '#e5e5e0',
                  background:    selected === t.id ? t.color + '08' : 'white',
                  outline:       selected === t.id ? '2px solid ' + t.color : 'none',
                  outlineOffset: '-1px',
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
                    style={{ background: t.color }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{t.name}</span>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{t.full}</p>
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: '#9ca3af' }}>{'⏱ ' + t.time}</span>
                      <span className="text-xs" style={{ color: '#9ca3af' }}>{'· ' + t.age}</span>
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
              style={{ borderColor: '#e5e5e0', color: '#6b7280', background: 'white' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleStart} disabled={!selected || isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: (!selected || isPending) ? '#9ca3af' : '#2563eb',
                cursor:     (!selected || isPending) ? 'not-allowed' : 'pointer',
              }}>
              {isPending ? 'Iniciando...' : 'Comenzar evaluación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}