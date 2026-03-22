/**
 * /display/[sessionId] — Pantalla del evaluado
 *
 * Esta página se muestra en el computador o proyector frente al niño.
 * Recibe comandos en tiempo real desde el ScoringPanel del psicólogo.
 * Diseño limpio, minimalista y amigable para niños.
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams }           from 'next/navigation'
import { createClient }        from '@supabase/supabase-js'
import { useSessionRealtime, type DisplayCommand } from '@/hooks/useSessionRealtime'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Componentes de pantalla ─────────────────────────────────

function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 bg-slate-50">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
        </svg>
      </div>
      <p className="text-2xl text-slate-400 font-light tracking-wide">Esperando al evaluador…</p>
    </div>
  )
}

function InstructionsScreen({ text, subtest }: { text: string; subtest: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-10 px-16 bg-white">
      <div className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-medium">
        {subtestLabel(subtest)}
      </div>
      <p className="text-3xl text-slate-700 font-light text-center leading-relaxed max-w-2xl">
        {text}
      </p>
    </div>
  )
}

function ItemImageScreen({ imageUrl, itemNumber, subtest }: {
  imageUrl: string; itemNumber: number; subtest: string
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 bg-white">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {subtestLabel(subtest)} — Ítem {itemNumber}
      </div>
      <div className="max-w-3xl max-h-[70vh] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Ítem ${itemNumber}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
        />
      </div>
    </div>
  )
}

function ItemTextScreen({ text, itemNumber, subtest }: {
  text: string; itemNumber: number; subtest: string
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-10 px-20 bg-white">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {subtestLabel(subtest)} — Ítem {itemNumber}
      </div>
      <p className="text-5xl text-slate-800 font-light text-center leading-relaxed">
        {text}
      </p>
    </div>
  )
}

function FinishedScreen({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 bg-gradient-to-b from-indigo-50 to-white">
      <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
        <svg className="w-12 h-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-3xl text-slate-600 font-light text-center max-w-lg leading-relaxed">
        {text ?? '¡Muy bien! Ya terminamos por hoy.'}
      </p>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function subtestLabel(code: string): string {
  const labels: Record<string, string> = {
    CC: 'Construcción con Cubos', AN: 'Analogías', MR: 'Matrices de Razonamiento',
    RD: 'Retención de Dígitos', CLA: 'Claves', VOC: 'Vocabulario', BAL: 'Balanzas',
    RV: 'Rompecabezas Visuales', RI: 'Retención de Imágenes', BS: 'Búsqueda de Símbolos',
    IN: 'Información', SLN: 'Span de Letras y Números', CAN: 'Cancelación',
    COM: 'Comprensión', ARI: 'Aritmética',
  }
  return labels[code] ?? code
}

function renderDisplay(cmd: DisplayCommand | null) {
  if (!cmd) return <WaitingScreen />

  switch (cmd.type) {
    case 'wait':
      return <WaitingScreen />
    case 'show_instructions':
      return <InstructionsScreen text={cmd.text ?? ''} subtest={cmd.subtest} />
    case 'show_item':
      if (cmd.imageUrl) {
        return (
          <ItemImageScreen
            imageUrl={cmd.imageUrl}
            itemNumber={cmd.itemNumber ?? 0}
            subtest={cmd.subtest}
          />
        )
      }
      return (
        <ItemTextScreen
          text={cmd.text ?? ''}
          itemNumber={cmd.itemNumber ?? 0}
          subtest={cmd.subtest}
        />
      )
    case 'finished':
      return <FinishedScreen text={cmd.text} />
    default:
      return <WaitingScreen />
  }
}

// ─── Página principal ─────────────────────────────────────────

export default function TestDisplayPage() {
  const params    = useParams()
  const sessionId = params.sessionId as string

  const [channelName, setChannelName] = useState<string | null>(null)

  // Obtener el nombre del canal de la sesión
  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('sessions')
      .select('realtime_channel')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        if (data?.realtime_channel) setChannelName(data.realtime_channel)
      })
  }, [sessionId])

  const { state } = useSessionRealtime(channelName)

  // Pantalla completa sin barra de navegación
  return (
    <div className="fixed inset-0 bg-white select-none">
      {renderDisplay(state.displayCommand)}

      {/* Indicador de conexión (esquina inferior derecha, discreto) */}
      <div className="fixed bottom-4 right-4">
        <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
      </div>
    </div>
  )
}
