'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { CancelSessionButton } from '@/components/CancelSession'
import { useSessionRealtime } from '@/hooks/useSessionRealtime'
import type { WiscScoringResult, SubtestCode } from '@/lib/wisc5/engine'

export default function SessionPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const [result, setResult] = useState<WiscScoringResult | null>(null)
  const { state } = useSessionRealtime(sessionId as string)

  useEffect(() => {
    async function loadResult() {
      const { data, error } = await supabase
        .from('resultados')
        .select('*')
        .eq('session_id', sessionId)
        .eq('test', 'WISC5')
        .single()

      if (!error && data) {
        setResult(data.resultado as WiscScoringResult)
      }
    }
    loadResult()
  }, [sessionId])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Sesión WISC5</h1>
      {result ? (
        <pre className="text-sm bg-gray-50 p-2 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <p>Cargando resultados…</p>
      )}
      <CancelSessionButton sessionId={sessionId as string} />
    </div>
  )
}