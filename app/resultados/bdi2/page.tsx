'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'
import { useReportDocx } from '@/hooks/useReportDocx'

const printStyles = `
  @media print {
    body { margin: 0; padding: 0; background: white; }
    .no-print { display: none; }
    .reporte-container { padding: 1.5cm; width: 100%; }
    .page-break-before { page-break-before: always; }
    .page-break-inside { page-break-inside: avoid; }
  }
`

function getSeverityClass(severity: string): string {
  switch (severity) {
    case 'minima': return 'text-green-700'
    case 'leve': return 'text-yellow-700'
    case 'moderada': return 'text-orange-700'
    case 'grave': return 'text-red-700'
    default: return 'text-gray-700'
  }
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'minima': return 'Depresión mínima'
    case 'leve': return 'Depresión leve'
    case 'moderada': return 'Depresión moderada'
    case 'grave': return 'Depresión grave'
    default: return 'No clasificado'
  }
}

function Bdi2ResultsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''
  const contentRef = useRef<HTMLDivElement>(null)

  const [result, setResult] = useState<any>(null)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientRut, setPatientRut] = useState('')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined)
  const [patientSchool, setPatientSchool] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [planStatus, setPlanStatus] = useState<any>(null)

  const { generateDocx } = useReportDocx()

  useEffect(() => {
    if (!sessionId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const load = async () => {
      try {
        // 1. Cargar puntajes BDI-II
        const { data: scores, error: scoresError } = await supabase
          .from('bdi2_scores')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (scoresError || !scores) {
          setLoading(false)
          return
        }

        // Reconstruir respuestas
        const responses: Record<number, number> = {}
        for (let i = 1; i <= 21; i++) {
          const key = 'item_' + i
          if (scores[key] !== undefined && scores[key] !== null) {
            responses[i] = scores[key]
          }
        }

        const totalScore = scores.total_score || 0
        const severity = scores.severity_label || 'No clasificado'
        const cognitiveAffectiveScore = scores.cognitive_affective_score || 0
        const somaticMotivationalScore = scores.somatic_motivational_score || 0
        const suicidalIdeationScore = scores.suicidal_ideation_score || 0

        setResult({
          totalScore,
          severity,
          cognitiveAffectiveScore,
          somaticMotivationalScore,
          suicidalIdeationScore,
          responses,
        })

        // 2. Cargar datos del paciente
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('started_at, patient:patients(id, full_name, rut, birth_date, school)')
          .eq('id', sessionId)
          .single()

        if (sessionData?.patient) {
          const p = sessionData.patient as any
          setPatientName(p.full_name ?? '')
          setPatientId(p.id ?? '')
          setPatientRut(p.rut ?? '')
          setPatientSchool(p.school ?? '')
          if (p.birth_date) {
            setPatientBirthDate(new Date(p.birth_date).toLocaleDateString('es-CL'))
            const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear()
            setPatientAge(age)
          }
        }
        if (sessionData?.started_at) {
          setEvalDate(new Date(sessionData.started_at).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'long', year: 'numeric'
          }))
        }

        // 3. Cargar plan del usuario
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          const plan = Array.isArray(planData) ? planData[0] : planData
          setPlanStatus(plan)
        }

      } catch (err) {
        console.error('Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

  const isPro = planStatus?.is_pro || false

  const handleDownload = (type: 'docx' | 'odt') => {
    if (!result) return
    const meta = {
      sessionId,
      patientId,
      testId: 'bdi2',
      patientName,
      content: {
        totalScore: result.totalScore,
        severity: result.severity,
        cognitiveAffectiveScore: result.cognitiveAffectiveScore,
        somaticMotivationalScore: result.somaticMotivationalScore,
        suicidalIdeationScore: result.suicidalIdeationScore,
        responses: result.responses,
      }
    }
    generateDocx(contentRef, meta, type)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: '#4b5563' }}>No se encontraron resultados</p>
          <button onClick={() => router.back()} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>

      {/* Barra superior - no imprimible */}
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>BDI-II</span>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border"
          style={{ color: '#4b5563', borderColor: '#e5e5e0' }}
        >
          Imprimir
        </button>
        <PdfDownloadButton
          contentRef={contentRef}
          meta={{
            sessionId,
            patientId,
            testId: 'bdi2',
            patientName,
            content: {
              totalScore: result.totalScore,
              severity: result.severity,
              cognitiveAffectiveScore: result.cognitiveAffectiveScore,
              somaticMotivationalScore: result.somaticMotivationalScore,
              suicidalIdeationScore: result.suicidalIdeationScore,
              responses: result.responses,
            }
          }}
          label="PDF"
        />
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
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: '#e5e5e0', color: '#4b5563' }}
        >
          Volver al dashboard
        </button>
      </div>

      {/* Contenido */}
      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>
        <ReporteHeader
          patientName={patientName}
          patientRut={patientRut}
          patientBirthDate={patientBirthDate}
          patientAge={patientAge}
          patientSchool={patientSchool}
          evalDate={evalDate}
          testName="BDI-II - Inventario de Depresión de Beck"
        />

        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Resultados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Puntaje total</div>
              <div className="text-3xl font-bold" style={{ color: '#1a1a1a' }}>{result.totalScore}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Severidad</div>
              <div className={`text-xl font-semibold ${getSeverityClass(result.severity)}`}>
                {getSeverityLabel(result.severity)}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Puntaje cognitivo-afectivo</div>
              <div className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{result.cognitiveAffectiveScore}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Puntaje somático-motivacional</div>
              <div className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{result.somaticMotivationalScore}</div>
            </div>
          </div>
          {result.suicidalIdeationScore > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Ideación suicida detectada: {result.suicidalIdeationScore} puntos.
                Se recomienda evaluación inmediata por un profesional de salud mental.
              </p>
            </div>
          )}
        </div>

        <ReporteFooter showFirma={true} />
      </div>
    </div>
  )
}

export default function Bdi2ResultsPage() {
  return <Bdi2ResultsPageInner />
}