import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useRealtime(channelId: string, onMessage: (payload: any) => void) {
  const channelRef = useRef<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!channelId) return
    const channel = supabase.channel(channelId)
    channel.on('broadcast', { event: 'message' }, (payload) => {
      onMessage(payload.payload ?? payload)
    })
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') setConnected(true)
    })
    channelRef.current = channel
    return () => {
      channel.unsubscribe()
      setConnected(false)
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

  return { sendMessage, connected }
}