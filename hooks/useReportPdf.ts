/**
 * useReportPdf
 *
 * Hook reutilizable para los 4 tests (WISC-V, PECA, BDI-II, Coopersmith).
 * Captura el HTML del informe con html2canvas → genera PDF con jsPDF →
 * sube a Supabase Storage → guarda URL en tabla `reports`.
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
  content?:    Record<string, unknown>
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
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const canvas = await html2canvas(ref.current, {
        scale:           2,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
        windowWidth:     ref.current.scrollWidth,
        windowHeight:    ref.current.scrollHeight,
      })

      const A4_W_MM   = 210
      const A4_H_MM   = 297
      const MARGIN_MM = 15
      const EXTRA_MM  = 20   // Margen extra para la última página (asegura footer)

      const pdf       = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pxPerMm   = canvas.width / (A4_W_MM - MARGIN_MM * 2)
      const imgH_mm   = canvas.height / pxPerMm
      const pageH_mm  = A4_H_MM - MARGIN_MM * 2

      let yOffset = 0
      let page    = 0

      while (yOffset < imgH_mm) {
        if (page > 0) pdf.addPage()

        let sliceH_mm = Math.min(pageH_mm, imgH_mm - yOffset)
        // Si es la última página, añadir margen extra
        if (yOffset + sliceH_mm >= imgH_mm) {
          sliceH_mm = Math.min(sliceH_mm + EXTRA_MM, imgH_mm - yOffset + EXTRA_MM)
        }

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

      let resolvedPatientId = meta.patientId
      if (!resolvedPatientId) {
        const res = await fetch(`/api/session/patient?sessionId=${meta.sessionId}`)
        if (res.ok) {
          const d = await res.json()
          resolvedPatientId = d.patientId ?? ''
        }
      }

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

      const { data: urlData } = await supabase.storage
        .from('reports')
        .createSignedUrl(fileName, 60 * 60 * 24)

      const pdfUrl = urlData?.signedUrl ?? null

      const title = `${TEST_TITLE[meta.testId] ?? 'Informe'} — ${meta.patientName}`

      await supabase.from('reports').upsert({
        session_id:       meta.sessionId,
        psychologist_id:  user.id,
        patient_id:       resolvedPatientId,
        title,
        content:          meta.content ?? {},
        pdf_url:          pdfUrl,
      }, { onConflict: 'session_id' })

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