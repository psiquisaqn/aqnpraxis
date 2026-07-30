'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Bdi2Control } from './bdi2'

console.log('🔴 [PAGE MINIMO] Cargando...')

export default function DualControlPage() {
  console.log('🔴 [PAGE MINIMO] Renderizando...')
  const params = useParams()
  const dualSessionId = params.dualSessionId as string
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔴 [PAGE MINIMO] useEffect ejecutándose, dualSessionId:', dualSessionId)
    const load = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('dual_sessions')
        .select('session_id')
        .eq('id', dualSessionId)
        .single()
      if (data?.session_id) {
        console.log('✅ Session ID obtenido:', data.session_id)
        setSessionId(data.session_id)
      }
    }
    if (dualSessionId) load()
  }, [dualSessionId])

  if (!sessionId) return <div>Cargando sesión...</div>

  console.log('🔴 [PAGE MINIMO] Renderizando Bdi2Control...')
  return (
    <Bdi2Control
      dualSessionId={dualSessionId}
      sessionId={sessionId}
      onUpdatePatient={() => {}}
      onSaveResponse={() => {}}
      displayReady={true}
    />
  )
}