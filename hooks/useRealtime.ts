'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

type MessagePayload = {
  type: string
  [key: string]: any
}

export function useRealtime(channelId: string, onMessage: (payload: MessagePayload) => void) {
  const supabase = supabase()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!channelId) return

    // Crear canal
    const channel = supabase.channel(`dual:${channelId}`)
    
    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        onMessage(payload as MessagePayload)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [channelId, onMessage, supabase])

  const sendMessage = (payload: MessagePayload) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload
      })
    }
  }

  return { sendMessage }
}