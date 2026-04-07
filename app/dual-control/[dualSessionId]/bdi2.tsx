'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BDI2_ITEMS, scoreBdi2, type BdiResponse } from '@/lib/bdi2/engine'
import { supabase } from '@/lib/supabase/client'

interface Bdi2ControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}

export function Bdi2Control({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }: Bdi2ControlProps) {
  const router = useRouter()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<Record<number, BdiResponse>>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!firstItemSent.current) {
        onUpdatePatient(buildPayload(1))
        firstItemSent.current = true
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (displayReady) {
      onUpdatePatient(buildPayload(currentItem, responses[currentItem]))
      firstItemSent.current = true
    }
  }, [displayReady])

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
      const result = scoreBdi2(responses)
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
      if (error) { alert('Error al guardar: ' + error.message); setFinishing(false); return }
      await supabase.from('sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId)
      router.push('/dashboard')
    } catch(e: any) {
      alert('Error: ' + e.message)
      setFinishing(false)
    }
  }

  return (
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

      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-2">Ir a item:</p>
        <div className="grid grid-cols-7 gap-1">
          {BDI2_ITEMS.map((item) => (
            <button key={item.num} onClick={() => goToItem(item.num)}
              className={"text-xs py-1 rounded " + (currentItem===item.num ? 'bg-blue-600 text-white' : responses[item.num] !== undefined ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
              {item.num}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
