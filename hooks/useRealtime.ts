import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useRealtime(channelId: string, onMessage: (payload: any) => void) {
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!channelId) return
    const channel = supabase.channel(channelId)
    channel.on('broadcast', { event: 'message' }, (payload) => {
      onMessage(payload)
    })
    channel.subscribe()
    channelRef.current = channel
    return () => {
      channel.unsubscribe()
    }
  }, [channelId, onMessage])

  const sendMessage = (payload: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload,
      })
    }
  }

  return { sendMessage }
}