'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { scoreBdi2, BDI2_SEVERITY_COLORS, type BdiResult } from '@/lib/bdi2/engine'
import type { ReportMeta } from '@/hooks/useReportPdf'

export default function ReportPage() {
  const { sessionId } = useParams()
  const [resultado, setResultado] = useState<BdiResult | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function loadResult() {
      const { data, error } = await supabase
        .from('resultados')
        .select('*')
        .eq('session_id', sessionId)
        .eq('test', 'BDI2')
        .single()

      if (!error && data) {
        setResultado(data.resultado)
      }
    }
    loadResult()
  }, [sessionId])

  const meta: ReportMeta = {
    sessionId: sessionId as string,
    patientId: 'paciente-123',   // reemplaza con el ID real del paciente
    patientName: 'Paciente X',
    testId: 'BDI2',
  }

  return (
    <div ref={contentRef} className="p-6">
      <h1 className="text-xl font-bold mb-4">Reporte BDI2</h1>
      {resultado ? (
        <div>
          <p className="mb-2">
            Severidad:{' '}
            <span style={{ color: BDI2_SEVERITY_COLORS[resultado.severity] }}>
              {resultado.severityLabel}
            </span>
          </p>
          <p>Puntaje total: {resultado.totalScore}</p>
        </div>
      ) : (
        <p>Cargando resultados…</p>
      )}
      <div className="mt-4">
        <PdfDownloadButton contentRef={contentRef} meta={meta} />
      </div>
    </div>
  )
}