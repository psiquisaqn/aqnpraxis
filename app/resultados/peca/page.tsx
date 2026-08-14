'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PdfDownloadButton } from '@/components/PdfDownloadButton'
import { scorePeca, type PecaResult } from '@/lib/peca/engine'
import { ReporteHeader } from '@/components/ReporteHeader'
import { ReporteFooter } from '@/components/ReporteFooter'
import { useReportDocx } from '@/hooks/useReportDocx'

// Importar interpretaciones desde lib
import {
  getInterpretacionParticipacion,
  getInterpretacionDimension,
  getConclusionGeneral,
} from '@/lib/interpretaciones/peca'

const printStyles = `
  @media print {
    body { margin: 0; padding: 0; background: white; }
    .no-print { display: none; }
    .reporte-container { padding: 1.5cm; width: 100%; }
    .page-break-before { page-break-before: avoid; }
    .page-break-inside { page-break-inside: avoid; }
    h2, h3, .grafico-barras-container { page-break-inside: avoid; }
  }
`

function getIntensityColor(intensity: string): string {
  switch (intensity) {
    case 'Generalizado': return '#A32D2D'
    case 'Extenso':      return '#993C1D'
    case 'Limitado':     return '#854F0B'
    case 'Intermitente': return '#3B6D11'
    default:             return '#166534'
  }
}

function GraficoBarrasDimensiones({ data }: { data: Array<{ label: string; value: number; intensidad: string }> }) {
  const maxVal = 100
  const shortLabels: Record<string, string> = {
    'Comunicación': 'Com.',
    'Académico func.': 'Acad.',
    'Vida diaria': 'V. diaria',
    'Habilidad social': 'H. social',
    'Autocuidado': 'Auto.',
    'Uso comunidad': 'Uso com.',
    'Autodirección': 'Autodir.',
    'Conducta social': 'C. social',
    'Ocio/trabajo': 'Ocio'
  }
  
  return (
    <div className="grafico-barras-container" style={{ margin: '20px 0', fontFamily: 'Georgia, Times New Roman, serif', pageBreakInside: 'avoid' }}>
      <div className="grafico-barras" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-end', 
        minHeight: '220px',
        borderBottom: '1px solid #333',
        borderLeft: '1px solid #333',
        paddingLeft: '10px',
        paddingBottom: '10px',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {data.map((item, idx) => {
          const alturaRelativa = (item.value / maxVal) * 160
          const color = getIntensityColor(item.intensidad)
          const shortLabel = shortLabels[item.label] || item.label.substring(0, 10)
          
          return (
            <div key={idx} style={{ textAlign: 'center', width: '55px' }}>
              <div style={{ 
                backgroundColor: color, 
                width: '32px', 
                margin: '0 auto', 
                height: `${Math.max(alturaRelativa, 4)}px`,
                marginBottom: '6px',
                transition: 'height 0.3s ease'
              }} title={`${item.value}% - ${item.intensidad}`} />
              <div style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'Georgia, Times New Roman, serif' }}>{shortLabel}</div>
              <div style={{ fontSize: '7px', color: color, marginTop: '1px' }}>{item.intensidad.substring(0, 4)}</div>
              <div style={{ fontSize: '8px', color: '#555' }}>{Math.round(item.value)}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PecaResultsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const contentRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<PecaResult | null>(null)
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

    async function load() {
      try {
        const { data: scores, error: scoresError } = await supabase
          .from('peca_scores')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (scoresError || !scores) { setLoading(false); return }

        const resp: Record<number, 1 | 2 | 3 | 4> = {}
        for (let i = 1; i <= 45; i++) {
          const key = 'p' + String(i).padStart(2, '0') as keyof typeof scores
          const val = scores[key]
          if (val !== null && val !== undefined) {
            resp[i] = val as 1 | 2 | 3 | 4
          }
        }
        const calculatedResult = scorePeca(resp)
        setResult(calculatedResult)

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

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: planData } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          const plan = Array.isArray(planData) ? planData[0] : planData
          setPlanStatus(plan)
        }

      } catch (err) {
        console.error('Error:', err)
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
      testId: 'peca',
      patientName,
      patientRut,
      patientBirthDate,
      patientAge,
      patientSchool,
      evalDate,
      content: {
        participationLevel: result.participationLevel,
        dimensions: result.dimensions,
        aamrSets: result.aamrSets,
        participationText: result.participationText,
        participationNeeds: result.participationNeeds,
      }
    }
    generateDocx(contentRef, meta, type)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#4a4a4a', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'white' }}>
      <div className="text-center">
        <p className="text-sm mb-3" style={{ color: '#4b5563' }}>No se encontraron resultados</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#4a4a4a' }}>← Volver</button>
      </div>
    </div>
  )

  const porcentajeParticipacion = Math.round(result.participationLevel * 100)
  const interpretacionParticipacion = getInterpretacionParticipacion(porcentajeParticipacion)
  const nivelColor = result.participationNeeds ? '#A32D2D' : '#166534'

  const datosGrafico = result.dimensions.map(dim => ({
    label: dim.label,
    value: dim.p2 * 100,
    intensidad: dim.intensityLabel
  }))

  return (
    <div className="min-h-screen" style={{ background: 'white' }}>
      <style>{printStyles}</style>
      
      <div className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-3 flex-wrap no-print" style={{ background: 'white', borderColor: '#e5e5e0' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>PECA</span>
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
            testId: 'peca',
            patientName,
            content: {
              participationLevel: result.participationLevel,
              dimensions: result.dimensions,
              aamrSets: result.aamrSets,
              participationText: result.participationText,
              participationNeeds: result.participationNeeds,
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

      <div ref={contentRef} className="reporte-container max-w-4xl mx-auto px-6 py-8 pb-12" style={{ fontFamily: 'Georgia, Times New Roman, serif', background: 'white' }}>
        <ReporteHeader
          patientName={patientName}
          patientRut={patientRut}
          patientBirthDate={patientBirthDate}
          patientAge={patientAge}
          patientSchool={patientSchool}
          evalDate={evalDate}
          testName="PECA - Prueba de Evaluación de Conducta Adaptativa"
        />

        {/* Participación general */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Participación general</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-3">
            <div className="text-center sm:text-left">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold" style={{ fontFamily: 'Georgia, Times New Roman, serif', color: nivelColor }}>
                  {porcentajeParticipacion}%
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: nivelColor }}>
                    {interpretacionParticipacion.nivel}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex h-2 rounded-full overflow-hidden">
                {[
                  { color: '#A32D2D', label: 'Muy bajo' },
                  { color: '#854F0B', label: 'Bajo' },
                  { color: '#639922', label: 'Medio' },
                  { color: '#3B6D11', label: 'Alto' },
                ].map((range) => (
                  <div key={range.label} className="flex-1" style={{ background: `${range.color}30` }} />
                ))}
              </div>
              <div className="relative mt-1">
                <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow -translate-x-1/2"
                  style={{ left: `${Math.min(porcentajeParticipacion, 99)}%`, top: 0, background: nivelColor }} />
              </div>
              <div className="flex justify-between text-[10px] mt-4" style={{ color: '#9ca3af' }}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-3 text-justify" style={{ color: '#4b5563' }}>{interpretacionParticipacion.descripcion}</p>
          <p className="text-sm font-medium" style={{ color: nivelColor }}>Recomendación: {interpretacionParticipacion.recomendacion}</p>
        </div>

        {/* Gráfico */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Perfil de Dimensiones Adaptativas</h2>
          </div>
          <GraficoBarrasDimensiones data={datosGrafico} />
        </div>

        {/* Interpretación de dimensiones */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Interpretación de Dimensiones</h2>
          </div>
          <div className="space-y-4">
            {result.dimensions.map((dim) => (
              <div key={dim.code} className="pb-3" style={{ pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>{dim.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                    background: `${getIntensityColor(dim.intensityLabel)}20`,
                    color: getIntensityColor(dim.intensityLabel)
                  }}>
                    {dim.intensityLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#e5e5e0' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${dim.p2 * 100}%`, background: getIntensityColor(dim.intensityLabel) }} />
                </div>
                <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>
                  {getInterpretacionDimension(dim.code, dim.p2, dim.intensityLabel)}
                </p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  {dim.itemsAnswered}/{dim.itemsTotal} ítems · Puntaje: {Math.round(dim.rawScore * 10) / 10}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Conjuntos AAMR */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conjuntos AAMR</h2>
          </div>
          <div className="space-y-4">
            {result.aamrSets.map((set) => (
              <div key={set.code} className="pb-3" style={{ pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold" style={{ color: '#1a1a1a' }}>{set.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                    background: set.needsSupport ? '#FEF3C7' : '#D1FAE5',
                    color: set.needsSupport ? '#92400E' : '#065F46'
                  }}>
                    {set.demandLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#e5e5e0' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${set.p2 * 100}%`, background: set.needsSupport ? '#F59E0B' : '#10B981' }} />
                </div>
                <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563' }}>{set.descriptionText}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conclusión */}
        <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakInside: 'avoid' }}>
          <div className="border-b border-gray-300 pb-2 mb-3">
            <h2 className="text-lg font-semibold uppercase tracking-wide" style={{ color: '#1a1a1a' }}>Conclusión y Recomendaciones</h2>
          </div>
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#4b5563', textAlign: 'justify' }}>
            {getConclusionGeneral({
              participationLevel: result.participationLevel,
              dimensions: result.dimensions,
              aamrSets: result.aamrSets,
              participationText: result.participationText,
              participationNeeds: result.participationNeeds,
            }, patientName)}
          </p>
        </div>

        <ReporteFooter showFirma={true} />
      </div>
    </div>
  )
}

export default function PecaResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PecaResultsPageInner />
    </Suspense>
  )
}