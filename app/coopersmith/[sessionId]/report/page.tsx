'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import type { CooperResult } from '@/lib/coopersmith/engine'
import type { ReportMeta } from '@/hooks/useReportPdf'

export default function ReportPage() {
  const { sessionId } = useParams()
  const [resultado, setResultado] = useState<CooperResult | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function loadResult() {
      const { data, error } = await supabase
        .from('resultados')
        .select('*')
        .eq('session_id', sessionId)
        .eq('test', 'COOPERSMITH')
        .single()

      if (!error && data) {
        setResultado(data.resultado as CooperResult)
      }
    }
    loadResult()
  }, [sessionId])

  const meta: ReportMeta = {
    sessionId: sessionId as string,
    patientId: 'paciente-123',   // reemplaza con el ID real
    patientName: 'Paciente X',
    testId: 'COOPERSMITH',
  }

  return (
    <div ref={contentRef} className="p-6">
      <h1 className="text-xl font-bold mb-4">Reporte Coopersmith</h1>
      {resultado ? (
        <pre className="text-sm bg-gray-50 p-2 rounded">
          {JSON.stringify(resultado, null, 2)}
        </pre>
      ) : (
        <p>Cargando resultados…</p>
      )}
      <PdfDownloadButton contentRef={contentRef} meta={meta} />
    </div>
  )
}