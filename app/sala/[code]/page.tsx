'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SalaPage({ params }: { params: { code: string } }) {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', params.code)
        .single()

      if (error) {
        console.error('Error fetching session:', error.message)
      } else {
        setSession(data)
      }
    }

    fetchSession()
  }, [params.code])

  if (!session) {
    return <div>Cargando sesión...</div>
  }

  return (
    <div>
      <h2>Sala: {params.code}</h2>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}