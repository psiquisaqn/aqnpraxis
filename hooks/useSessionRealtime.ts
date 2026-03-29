import { useEffect, useRef, useState, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { WiscScoringResult } from '@/lib/wisc5/engine'

// Aquí mantienes tu lógica original del hook, pero usando el supabase centralizado.
// Ejemplo mínimo:
export function useSessionRealtime(sessionId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [state, setState] = useState<any>(null)

  useEffect(() => {
    const channel = supabase.channel(`session:${sessionId}`)
    channelRef.current = channel

    // Suscripción a eventos
    channel.on('broadcast', { event: 'update' }, (payload) => {
      setState(payload.payload)
    })

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId])

  const sendDisplayCommand = useCallback(async (cmd: any) => {
    await supabase.channel(`session:${sessionId}`).send({
      type: 'broadcast',
      event: 'command',
      payload: cmd,
    })
  }, [sessionId])

  return { state, sendDisplayCommand }
}