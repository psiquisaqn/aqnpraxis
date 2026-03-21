// @ts-nocheck
/**
 * useSessionRealtime
 *
 * Se suscribe al canal Supabase Realtime de una sesión.
 * Tanto la pantalla del evaluado (TestDisplay) como el
 * panel del psicólogo (ScoringPanel) usan este hook para
 * mantenerse sincronizados en tiempo real.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient, RealtimeChannel }             from '@supabase/supabase-js'
import type { WiscScoringResult }                    from '@/lib/wisc5/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SessionState {
  currentSubtest: string | null
  currentItem: number | null
  /** Para TestDisplay: qué ítem mostrar al evaluado */
  displayCommand: DisplayCommand | null
  /** Últimos puntajes calculados (del motor) */
  scoring: WiscScoringResult | null
  /** Estado de conexión */
  connected: boolean
}

export interface DisplayCommand {
  type: 'show_item' | 'show_instructions' | 'wait' | 'finished'
  subtest: string
  itemNumber?: number
  imageUrl?: string
  text?: string
}

export interface ChannelMessage {
  event: 'display_command' | 'score_update' | 'session_control'
  payload: unknown
}

export function useSessionRealtime(channelName: string | null) {
  const [state, setState] = useState<SessionState>({
    currentSubtest: null,
    currentItem: null,
    displayCommand: null,
    scoring: null,
    connected: false,
  })

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!channelName) return

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'display_command' }, ({ payload }) => {
        setState(prev => ({
          ...prev,
          displayCommand: payload as DisplayCommand,
          currentSubtest: (payload as DisplayCommand).subtest ?? prev.currentSubtest,
          currentItem: (payload as DisplayCommand).itemNumber ?? prev.currentItem,
        }))
      })
      .on('broadcast', { event: 'score_update' }, ({ payload }) => {
        setState(prev => ({
          ...prev,
          scoring: payload as WiscScoringResult,
        }))
      })
      .on('broadcast', { event: 'session_control' }, ({ payload }) => {
        const { action } = payload as { action: string }
        if (action === 'end_session') {
          setState(prev => ({
            ...prev,
            displayCommand: { type: 'finished', subtest: '', text: 'La evaluación ha finalizado. Gracias por tu participación.' },
          }))
        }
      })
      .subscribe((status) => {
        setState(prev => ({ ...prev, connected: status === 'SUBSCRIBED' }))
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName])

  /** Enviar comando de pantalla (solo el psicólogo llama esto) */
  const sendDisplayCommand = useCallback(async (cmd: DisplayCommand) => {
    if (!channelRef.current) return
    await channelRef.current.send({
      type: 'broadcast',
      event: 'display_command',
      payload: cmd,
    })
  }, [])

  /** Enviar control de sesión */
  const sendSessionControl = useCallback(async (action: string) => {
    if (!channelRef.current) return
    await channelRef.current.send({
      type: 'broadcast',
      event: 'session_control',
      payload: { action },
    })
  }, [])

  return { state, sendDisplayCommand, sendSessionControl }
}
