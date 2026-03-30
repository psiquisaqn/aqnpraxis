/**
 * useReportPdf
 *
 * Hook reutilizable para los 4 tests (WISC-V, PECA, BDI-II, Coopersmith).
 * Captura el HTML del informe con html2canvas â†’ genera PDF con jsPDF â†’
 * sube a Supabase Storage â†’ guarda URL en tabla `reports`.
 *
 * Uso:
 *   const { generating, saved, generatePdf } = useReportPdf()
 *   <div ref={contentRef}>â€¦contenido del informeâ€¦</div>
 *   <button onClick={() => generatePdf(contentRef, meta)}>Guardar PDF</button>
 */

'use client'

import { useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface ReportMeta {
  sessionId:   string
  patientId:   string
  testId:      string       // 'wisc5_cl' | 'peca_aqn' | 'beck_bdi2' | 'coopersmith'
  patientName: string
  evalDate?:   string
  content?:    Record<string, unknown>  // resumen JSON opcional para bÃºsqueda
}

export interface UseReportPdfReturn {
  generating:  boolean
  saved:       boolean
  error:       string | null
  generatePdf: (ref: React.RefObject<HTMLElement | null>, meta: ReportMeta) => Promise<string | null>
}

const TEST_TITLE: Record<string, string> = {
  wisc5_cl:    'Informe WISC-V Chile',
  peca_aqn:    'Informe PECA',
  beck_bdi2:   'Informe BDI-II',
  coopersmith: 'Informe Coopersmith SEI',
}

export function useReportPdf(): UseReportPdfReturn {
  const [generating, setGenerating] = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const generatePdf = useCallback(async (
    ref:  React.RefObject<HTMLElement | null>,
    meta: ReportMeta
  ): Promise<string | null> => {
    if (!ref.current) return null

    setGenerating(true)
    setSaved(false)
    setError(null)

    try {
      // â”€â”€ 1. Importar librerÃ­as dinÃ¡micamente (evita SSR) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      // â”€â”€ 2. Capturar el HTML como canvas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const canvas = await html2canvas(ref.current, {
        scale:           2,          // resoluciÃ³n 2x para nitidez
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
        windowWidth:     ref.current.scrollWidth,
        windowHeight:    ref.current.scrollHeight,
      })

      // â”€â”€ 3. Construir el PDF pÃ¡gina a pÃ¡gina â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const A4_W_MM   = 210
      const A4_H_MM   = 297
      const MARGIN_MM = 15

      const pdf       = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const imgData   = canvas.toDataURL('image/jpeg', 0.95)
      const pxPerMm   = canvas.width / (A4_W_MM - MARGIN_MM * 2)
      const imgH_mm   = canvas.height / pxPerMm
      const pageH_mm  = A4_H_MM - MARGIN_MM * 2

      let yOffset = 0
      let page    = 0

      while (yOffset < imgH_mm) {
        if (page > 0) pdf.addPage()

        const sliceH_mm = Math.min(pageH_mm, imgH_mm - yOffset)
        // Recortar el canvas verticalmente para esta pÃ¡gina
        const srcY  = (yOffset / imgH_mm) * canvas.height
        const srcH  = (sliceH_mm / imgH_mm) * canvas.height

        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width  = canvas.width
        sliceCanvas.height = srcH
        const ctx = sliceCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        pdf.addImage(
          sliceCanvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          MARGIN_MM,
          MARGIN_MM,
          A4_W_MM - MARGIN_MM * 2,
          sliceH_mm,
        )

        yOffset += pageH_mm
        page++
      }

      // â”€â”€ 3b. Resolver patientId si no se pasÃ³ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      let resolvedPatientId = meta.patientId
      if (!resolvedPatientId) {
        const res = await fetch(`/api/session/patient?sessionId=${meta.sessionId}`)
        if (res.ok) {
          const d = await res.json()
          resolvedPatientId = d.patientId ?? ''
        }
      }

      // â”€â”€ 4. Subir a Supabase Storage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const dateStr   = new Date().toISOString().split('T')[0]
      const fileName  = `${user.id}/${meta.testId}_${meta.sessionId}_${dateStr}.pdf`
      const pdfBlob   = pdf.output('blob')

      const { error: uploadErr } = await supabase.storage
        .from('reports')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (uploadErr) throw new Error(uploadErr.message)

      // â”€â”€ 5. Obtener URL firmada (24 h) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const { data: urlData } = await supabase.storage
        .from('reports')
        .createSignedUrl(fileName, 60 * 60 * 24)

      const pdfUrl = urlData?.signedUrl ?? null

      // â”€â”€ 6. Guardar registro en tabla reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const title = `${TEST_TITLE[meta.testId] ?? 'Informe'} â€” ${meta.patientName}`

      await supabase.from('reports').upsert({
        session_id:       meta.sessionId,
        psychologist_id:  user.id,
        patient_id:       resolvedPatientId,
        title,
        content:          meta.content ?? {},
        pdf_url:          pdfUrl,
      }, { onConflict: 'session_id' })

      // â”€â”€ 7. Descargar localmente tambiÃ©n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`)

      setSaved(true)
      return pdfUrl
    } catch (err: any) {
      setError(err?.message ?? 'Error al generar el PDF')
      return null
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generating, saved, error, generatePdf }
}
