'use client'

import { startTransition } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function CancelSession({ sessionId }: { sessionId: string }) {
  const cancel = () => {
    startTransition(async () => {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      if (error) {
        console.error('Error cancelling session:', error.message)
      } else {
        console.log('Session cancelled successfully')
      }
    })
  }

  return <button onClick={cancel}>Cancelar sesión</button>
}