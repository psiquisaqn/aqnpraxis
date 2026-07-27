'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'
import { useReportDocx } from '@/hooks/useReportDocx'

interface EntrevistaData {
  id: string
  fecha: string
  hora: string
  asistentes: string | null
  motivacion_principal: string | null
  info_relevante: string | null
  sugerencias_acuerdos: string | null
  created_at: string
  patient: {
    full_name: string
    rut: string | null
    birth_date: string | null
    school: string | null
  } | null
}

export default function EntrevistaDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [entrevista, setEntrevista] = useState<EntrevistaData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [planStatus, setPlanStatus] = useState<any>(null)

  const { generateDocx } = useReportDocx()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Cargar entrevista y plan del usuario
  useEffect(() => {
    const load = async () => {
      try {
        // 1. Cargar entrevista
        const { data, error } = await supabase
          .from('entrevistas')
          .select(`
            *,
            patient:patients(full_name, rut, birth_date, school)
          `)
          .eq('id', params.id)
          .single()

        if (error || !data) {
          setError('Entrevista no encontrada')
          setLoading(false)
          return
        }
        setEntrevista(data)

        // 2. Cargar plan del usuario
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          const plan = Array.isArray(planData) ? planData[0] : planData
          setPlanStatus(plan)
        }
      } catch (err) {
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, supabase])

  // Handlers para DOCX/ODT
  const handleDownload = (type: 'docx' | 'odt') => {
    if (!entrevista) return
    const meta = {
      sessionId: entrevista.id,
      patientId: entrevista.patient?.full_name || 'Desconocido',
      testId: 'entrevista',
      patientName: entrevista.patient?.full_name || '',
      content: {
        type: 'entrevista',
        ...entrevista,
      }
    }
    generateDocx(contentRef, meta, type)
  }

  const isPro = planStatus?.is_pro || false

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error || !entrevista) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error || 'No se encontró la entrevista'}</p>
          <button onClick={() => router.back()} className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
            Volver
          </button>
        </div>
      </div>
    )
  }

  const patient = entrevista.patient

  return (
    <div className="min-h-screen bg-white">
      {/* Barra superior - no imprimible */}
      <div className="sticky top-0 z-20 border-b bg-white px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Entrevista Psicológica</span>
        <span className="text-xs text-gray-400">{new Date(entrevista.fecha).toLocaleDateString('es-CL')}</span>
        <div className="flex-1" />

        <button
          onClick={() => window.print()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Imprimir
        </button>

        <PdfDownloadButton
          contentRef={contentRef}
          meta={{
            sessionId: entrevista.id,
            patientId: patient?.full_name || 'Desconocido',
            testId: 'entrevista',
            patientName: patient?.full_name || '',
            content: {
              type: 'entrevista',
              ...entrevista,
            }
          }}
          label="PDF"
        />

        {/* Botones DOCX y ODT solo para Premium */}
        {isPro && (
          <>
            <button
              onClick={() => handleDownload('docx')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              DOCX
            </button>
            <button
              onClick={() => handleDownload('odt')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              ODT
            </button>
          </>
        )}

        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          Volver
        </button>
      </div>

      {/* Contenido del informe */}
      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>
        <ReporteHeader
          patientName={patient?.full_name || ''}
          patientRut={patient?.rut || ''}
          patientBirthDate={patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-CL') : ''}
          patientSchool={patient?.school || ''}
          evalDate={new Date(entrevista.fecha).toLocaleDateString('es-CL')}
          testName="Informe de Entrevista Psicológica"
        />

        <div className="space-y-6">
          {/* Fecha y hora */}
          <div className="flex gap-8 text-sm">
            <div>
              <span className="font-semibold">Fecha:</span> {new Date(entrevista.fecha).toLocaleDateString('es-CL')}
            </div>
            <div>
              <span className="font-semibold">Hora:</span> {entrevista.hora}
            </div>
          </div>

          {/* Asistentes */}
          {entrevista.asistentes && (
            <div>
              <h3 className="text-md font-semibold border-b border-gray-200 pb-1 mb-2">Asistentes</h3>
              <p className="text-sm leading-relaxed text-gray-700">{entrevista.asistentes}</p>
            </div>
          )}

          {/* Motivación principal */}
          {entrevista.motivacion_principal && (
            <div>
              <h3 className="text-md font-semibold border-b border-gray-200 pb-1 mb-2">Motivación o Inquietud Principal</h3>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{entrevista.motivacion_principal}</p>
            </div>
          )}

          {/* Información relevante */}
          {entrevista.info_relevante && (
            <div>
              <h3 className="text-md font-semibold border-b border-gray-200 pb-1 mb-2">Información Relevante</h3>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{entrevista.info_relevante}</p>
            </div>
          )}

          {/* Sugerencias y acuerdos */}
          {entrevista.sugerencias_acuerdos && (
            <div>
              <h3 className="text-md font-semibold border-b border-gray-200 pb-1 mb-2">Sugerencias y Acuerdos</h3>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{entrevista.sugerencias_acuerdos}</p>
            </div>
          )}
        </div>

        <ReporteFooter showFirma={true} />
      </div>
    </div>
  )
}