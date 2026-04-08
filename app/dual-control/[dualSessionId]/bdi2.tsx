'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { BDI2_ITEMS, scoreBdi2, type BdiResponse } from '@/lib/bdi2/engine'
import { DualTestWrapper } from './DualTestWrapper'

interface Bdi2ControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}

function generarRecomendacionesBDI2(result: any): string {
  const score = result.totalScore
  if (score <= 13) {
    return "No se detectan niveles significativos de depresión. Se recomienda mantener seguimiento periódico."
  } else if (score <= 19) {
    return "Depresión leve. Se sugiere intervención psicoeducativa y seguimiento cada 2-3 meses."
  } else if (score <= 28) {
    return "Depresión moderada. Se recomienda intervención psicoterapéutica estructurada."
  } else if (score <= 63) {
    return "Depresión grave. Se recomienda intervención intensiva y derivación a psiquiatría."
  }
  return "Evaluación completada. Revisar resultados detallados."
}

export function Bdi2Control({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }: Bdi2ControlProps) {
  const router = useRouter()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<Record<number, BdiResponse>>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const firstItemSent = useRef(false)

  const currentItemData = BDI2_ITEMS.find(item => item.num === currentItem)
  const BDI_OPTIONS = [
    { value: 0, label: '0 - No aplica' },
    { value: 1, label: '1 - Leve' },
    { value: 2, label: '2 - Moderado' },
    { value: 3, label: '3 - Grave' },
  ]
  const allDone = completed === 21

  const buildPayload = (num: number, sel?: BdiResponse) => {
    const d = BDI2_ITEMS.find(i => i.num === num)
    return {
      type: 'bdi2', item: num,
      label: d?.label,
      options: BDI_OPTIONS,
      selected: sel,
      totalCompleted: completed,
      totalItems: 21
    }
  }

  const handleStartTest = () => {
    setShowQuestionZero(false)
    setTimeout(() => {
      if (!firstItemSent.current) {
        onUpdatePatient(buildPayload(1))
        firstItemSent.current = true
      }
    }, 500)
  }

  useEffect(() => {
    if (!showQuestionZero && !firstItemSent.current) {
      onUpdatePatient(buildPayload(1))
      firstItemSent.current = true
    }
  }, [showQuestionZero])

  useEffect(() => {
    if (displayReady && !showQuestionZero) {
      onUpdatePatient(buildPayload(currentItem, responses[currentItem]))
      firstItemSent.current = true
    }
  }, [displayReady, showQuestionZero])

  const handleResponse = (value: BdiResponse) => {
    const newResponses = { ...responses, [currentItem]: value }
    setResponses(newResponses)
    const newCompleted = Object.keys(newResponses).length
    setCompleted(newCompleted)
    onSaveResponse(currentItem, value)
    onUpdatePatient({ ...buildPayload(currentItem, value), totalCompleted: newCompleted })
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    onUpdatePatient(buildPayload(num, responses[num]))
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const result = scoreBdi2(responses)

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('patient_id')
        .eq('id', sessionId)
        .single()

      const { data: { user } } = await supabase.auth.getUser()
      const patientId = sessionData?.patient_id

      const itemCols: Record<string, number> = {}
      for (let i = 1; i <= 21; i++) {
        if (responses[i] !== undefined) itemCols['item_' + i] = responses[i] as number
      }

      const { error } = await supabase
        .from('bdi2_scores')
        .upsert({
          session_id: sessionId,
          ...itemCols,
          total_score: result.totalScore,
          severity: result.severity,
          severity_label: result.severityLabel,
          cognitive_affective_score: result.cognitiveAffectiveScore,
          somatic_motivational_score: result.somaticMotivationalScore,
          suicidal_ideation_score: result.suicidalIdeationScore,
          is_complete: true,
          calculated_at: new Date().toISOString(),
        }, { onConflict: 'session_id' })

      if (error) {
        alert('Error al guardar: ' + error.message)
        setFinishing(false)
        return
      }

      // Guardar informe
      const recomendaciones = generarRecomendacionesBDI2(result)
      await supabase
        .from('informes')
        .upsert({
          session_id: sessionId,
          patient_id: patientId,
          psychologist_id: user?.id,
          test_id: 'bdi2',
          titulo: `BDI-II - Inventario de Depresión`,
          contenido: JSON.stringify({
            totalScore: result.totalScore,
            severity: result.severityLabel,
            cognitiveAffectiveScore: result.cognitiveAffectiveScore,
            somaticMotivationalScore: result.somaticMotivationalScore,
            suicidalIdeationScore: result.suicidalIdeationScore
          }),
          puntaje_total: result.totalScore,
          nivel: result.severityLabel,
          recomendaciones: recomendaciones
        }, { onConflict: 'session_id' })

      await supabase
        .from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      router.push(`/bdi2/${sessionId}/report`)
    } catch(e: any) {
      alert('Error: ' + e.message)
      setFinishing(false)
    }
  }

  const bdiItemsList = BDI2_ITEMS.map(item => ({ num: item.num }))

  return (
    <DualTestWrapper
      title="Evaluación BDI-II - Inventario de Depresión"
      totalItems={21}
      currentItem={currentItem}
      completed={completed}
      onItemSelect={goToItem}
      items={bdiItemsList}
      showQuestionZero={showQuestionZero}
      onStart={handleStartTest}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progreso</span>
            <span className="text-gray-800 font-medium">{completed}/21 items</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: ((completed/21)*100) + '%' }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">Item {currentItem}/21</span>
            {responses[currentItem] !== undefined && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Respondido</span>}
          </div>
          <p className="text-gray-800 font-medium mb-4">{currentItemData?.label}</p>
          <div className="space-y-2">
            {BDI_OPTIONS.map((opt: any) => (
              <button key={opt.value} onClick={() => handleResponse(opt.value as BdiResponse)}
                className={"w-full text-left p-3 rounded-lg border text-sm transition-all " + (responses[currentItem] === opt.value ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => goToItem(Math.max(1, currentItem-1))} disabled={currentItem===1}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
            Anterior
          </button>
          <button onClick={() => goToItem(Math.min(21, currentItem+1))} disabled={currentItem===21}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
            Siguiente
          </button>
        </div>

        {allDone && (
          <button onClick={handleFinish} disabled={finishing}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
            {finishing ? 'Finalizando...' : 'Finalizar evaluacion BDI-II'}
          </button>
        )}
      </div>
    </DualTestWrapper>
  )
}