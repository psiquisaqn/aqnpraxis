const fs = require('fs')

// Fix useRealtime hook para exponer estado de conexion
let hook = fs.readFileSync('hooks/useRealtime.ts', 'utf8')

const oldHook = `export function useRealtime(channelId: string, onMessage: (payload: any) => void) {
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
  }, [channelId, onMessage])`

const newHook = `export function useRealtime(channelId: string, onMessage: (payload: any) => void) {
  const channelRef = useRef<any>(null)
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    if (!channelId) return
    setConnected(false)
    const channel = supabase.channel(channelId)
    channel.on('broadcast', { event: 'message' }, (payload) => {
      onMessage(payload)
    })
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true)
      }
    })
    channelRef.current = channel
    return () => {
      channel.unsubscribe()
      setConnected(false)
    }
  }, [channelId, onMessage])`

hook = hook.replace(oldHook, newHook)
hook = hook.replace(
  "import { useEffect, useRef } from 'react'",
  "import { useEffect, useRef, useState } from 'react'"
)
hook = hook.replace(
  '  return { sendMessage }',
  '  return { sendMessage, connected }'
)

fs.writeFileSync('hooks/useRealtime.ts', hook, 'utf8')
console.log('connected state:', hook.includes('connected'))
console.log('SUBSCRIBED:', hook.includes('SUBSCRIBED'))
