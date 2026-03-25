'use client'

import { ReactNode, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'

interface TestResultsLayoutProps {
  patientName: string
  patientId?: string
  testName: string
  testCode: string
  evalDate: string
  onBack?: () => void
  children: ReactNode
  pdfMeta?: {
    sessionId: string
    patientId: string
    testId: string
    patientName: string
    content: any
  }
}

export function TestResultsLayout({
  patientName,
  patientId,
  testName,
  testCode,
  evalDate,
  onBack,
  children,
  pdfMeta
}: TestResultsLayoutProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (patientId) {
      router.push(`/dashboard/paciente/${patientId}`)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 border-b px-4 py-3 flex items-center gap-3 bg-white border-gray-200">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">{testName}</span>
        <button
          onClick={() => window.print()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Imprimir
        </button>
        {pdfMeta && (
          <PdfDownloadButton
            contentRef={contentRef}
            meta={pdfMeta}
          />
        )}
      </div>

      <div ref={contentRef} className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                {testCode}
              </span>
              <h1 className="text-xl md:text-2xl font-medium mt-2 text-gray-900">
                {patientName || 'Paciente'}
              </h1>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>Fecha</div>
              <div className="font-medium text-gray-700">{evalDate || '—'}</div>
            </div>
          </div>

          {children}
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Generado por AQN Praxis · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
