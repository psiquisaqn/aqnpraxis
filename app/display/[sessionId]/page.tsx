'use client'

import { useParams } from 'next/navigation'
import { useSessionRealtime } from '@/hooks/useSessionRealtime'

export default function DisplayPage() {
  const { sessionId } = useParams()

  // El hook devuelve sólo state y sendDisplayCommand
  const { state, sendDisplayCommand } = useSessionRealtime(sessionId as string)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Display Session</h1>
      <pre className="text-sm bg-gray-50 p-2 rounded">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  )
}