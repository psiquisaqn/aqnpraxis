'use client'

import { useRef } from 'react'
import { useReportPdf, type ReportMeta } from '@/hooks/useReportPdf'

interface Props {
  contentRef: React.RefObject<HTMLElement | null>
  meta:       ReportMeta
  label?:     string
}

export function PdfDownloadButton({ contentRef, meta, label = 'Guardar PDF' }: Props) {
  const { generating, saved, error, generatePdf } = useReportPdf()

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-700">
          {error}
        </span>
      )}

      {saved && !generating && (
        <span className="flex items-center gap-1 text-xs font-medium text-green-700">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Guardado
        </span>
      )}

      <button
        onClick={() => generatePdf(contentRef, meta)}
        disabled={generating}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
          generating 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-teal-600 text-white hover:bg-teal-700'
        }`}
      >
        {generating ? (
          <>
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.5"/>
              <path d="M6 2a4 4 0 014 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Generando…
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {label}
          </>
        )}
      </button>
    </div>
  )
}