'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Hook ────────────────────────────────────────────────────────────
export function useCancelSession(sessionId: string, patientId?: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const cancel = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('sessions')
        .update({
          status:       'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      // Volver a la ficha del paciente si tenemos el id, si no al dashboard
      if (patientId) {
        router.push(`/dashboard/paciente/${patientId}`)
      } else {
        router.push('/dashboard')
      }
    })
  }

  return { cancel, isPending }
}

// ── Modal de confirmación ────────────────────────────────────────────
interface Props {
  open:      boolean
  onConfirm: () => void
  onClose:   () => void
  isPending: boolean
}

export function CancelSessionModal({ open, onConfirm, onClose, isPending }: Props) {
  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm animate-fade-up rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'white' }}
      >
        {/* Icono de advertencia */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: '#fef2f2' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 2L2 19h18L11 2z"
                stroke="#dc2626"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 9v4M11 15.5v.5"
                stroke="#dc2626"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h2
            className="text-base font-semibold mb-1"
            style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-serif)' }}
          >
            ¿Anular esta evaluación?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--stone-500)' }}>
            La sesión quedará marcada como <strong>cancelada</strong> y no se guardarán
            los resultados. Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Botones */}
        <div
          className="flex gap-2 px-6 py-4 border-t"
          style={{ borderColor: 'var(--stone-100)' }}
        >
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={{
              color:       'var(--stone-600)',
              borderColor: 'var(--stone-200)',
              background:  'white',
            }}
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{
              background: isPending ? 'var(--stone-300)' : '#dc2626',
              cursor:     isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Anulando…' : 'Sí, anular'}
          </button>
        </div>
      </div>
        </div>
      </div>
    </>
  )
}

// ── Botón trigger reutilizable ───────────────────────────────────────
interface TriggerProps {
  sessionId: string
  patientId?: string
}

export function CancelSessionButton({ sessionId, patientId }: TriggerProps) {
  const [open, setOpen] = useState(false)
  const { cancel, isPending } = useCancelSession(sessionId, patientId)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
        style={{
          color:       '#dc2626',
          borderColor: '#fecaca',
          background:  '#fef2f2',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 2l8 8M10 2l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Anular evaluación
      </button>

      <CancelSessionModal
        open={open}
        onConfirm={() => { setOpen(false); cancel() }}
        onClose={() => setOpen(false)}
        isPending={isPending}
      />
    </>
  )
}
