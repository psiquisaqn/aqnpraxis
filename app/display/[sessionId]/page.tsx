'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useSessionRealtime, type DisplayCommand } from '@/hooks/useSessionRealtime'

export default function DisplayPage() {
  const { sessionId } = useParams()

  // El hook devuelve un objeto con estado y funciones
  const { state, sendDisplayCommand, sendSessionControl } = useSessionRealtime(sessionId as string)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Display Session</h1>
      <pre className="text-sm bg-gray-50 p-2 rounded">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  )
}