'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BDI2_ITEMS, scoreBdi2, type BdiResponse } from '@/lib/bdi2/engine'

interface Bdi2ControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: BdiResponse) => void
}

const RESPONSE_OPTIONS = [
  { value: 0, label: '0 - No me siento así' },
  { value: 1, label: '1 - A veces me siento así' },
  { value: 2, label: '2 - Me siento así frecuentemente' },
  { value: 3, label: '3 - Me siento así todo el tiempo' },
]

export function Bdi2Control({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse }: Bdi2ControlProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<Record<number, BdiResponse>>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [displayReady, setDisplayReady] = useState(false)

  const currentItemData = BDI2_ITEMS.find(item => item.num === currentItem)
  const allDone = completed === 21

  useEffect(() => {
    const handleDisplayReady = () => {
      setDisplayReady(true)
    }
    window.addEventListener('display_ready', handleDisplayReady)
    return () => window.removeEventListener('display_ready', handleDisplayReady)
  }, [])

  const sendCurrentItemToDisplay = () => {
    const itemData = BDI2_ITEMS.find(item => item.num === currentItem)
    if (itemData) {
      onUpdatePatient({
        type: 'bdi2',
        item: currentItem,
        label: itemData.label,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem],
        totalCompleted: completed,
        totalItems: 21
      })
    }
  }

  useEffect(() => {
    if (displayReady) {
      sendCurrentItemToDisplay()
    }
  }, [displayReady, currentItem, completed])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!displayReady) {
        sendCurrentItemToDisplay()
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleResponse = (value: BdiResponse) => {
    const newResponses = { ...responses, [currentItem]: value }
    setResponses(newResponses)
    setCompleted(Object.keys(newResponses).length)
    onSaveResponse(currentItem, value)

    onUpdatePatient({
      type: 'bdi2',
      item: currentItem,
      label: currentItemData?.label,
      options: RESPONSE_OPTIONS,
      selected: value,
      totalCompleted: Object.keys(newResponses).length,
      totalItems: 21
    })
  }

  const goToNext = () => {
    if (currentItem < 21) {
      setCurrentItem(currentItem + 1)
      const nextItem = BDI2_ITEMS.find(item => item.num === currentItem + 1)
      onUpdatePatient({
        type: 'bdi2',
        item: currentItem + 1,
        label: nextItem?.label,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem + 1],
        totalCompleted: completed,
        totalItems: 21
      })
    }
  }

  const goToPrev = () => {
    if (currentItem > 1) {
      setCurrentItem(currentItem - 1)
      const prevItem = BDI2_ITEMS.find(item => item.num === currentItem - 1)
      onUpdatePatient({
        type: 'bdi2',
        item: currentItem - 1,
        label: prevItem?.label,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem - 1],
        totalCompleted: completed,
        totalItems: 21
      })
    }
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    const item = BDI2_ITEMS.find(i => i.num === num)
    onUpdatePatient({
      type: 'bdi2',
      item: num,
      label: item?.label,
      options: RESPONSE_OPTIONS,
      selected: responses[num],
      totalCompleted: completed,
      totalItems: 21
    })
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)

    const result = scoreBdi2(responses)

    // Guardar respuestas con formato i1, i2, etc.
    const itemCols: Record<string, number> = {}
    for (let i = 1; i <= 21; i++) {
      if (responses[i] !== undefined) {
        itemCols[`i${i}`] = responses[i]
      }
    }

    const { error: scoreError } = await supabase
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

    if (scoreError) {
      alert('Error al guardar resultados: ' + scoreError.message)
      setFinishing(false)
      return
    }

    await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    await supabase
      .from('dual_session_tests')
      .upsert({
        dual_session_id: dualSessionId,
        test_id: 'bdi2',
        status: 'completed',
        result: result,
        completed_at: new Date().toISOString(),
        responses: responses
      }, { onConflict: 'dual_session_id' })

    router.push(`/resultados/bdi2?session=${sessionId}`)
  }

  const currentResponse = responses[currentItem]

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progreso</span>
          <span className="text-gray-800 font-medium">{completed}/21 ítems</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completed / 21) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">Ítem {currentItem}/21</span>
          {currentResponse !== undefined && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Respondido</span>}
        </div>
        <p className="text-gray-800 text-base leading-relaxed mb-4">{currentItemData?.label}</p>
        <div className="space-y-2">
          {RESPONSE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleResponse(opt.value as BdiResponse)}
              className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${
                currentResponse === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={goToPrev} disabled={currentItem === 1} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">← Anterior</button>
        <button onClick={goToNext} disabled={currentItem === 21} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">Siguiente →</button>
      </div>

      {allDone && (
        <button onClick={handleFinish} disabled={finishing} className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
          {finishing ? 'Finalizando...' : '✓ Finalizar evaluación'}
        </button>
      )}

      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-2">Ir a ítem:</p>
        <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto">
          {BDI2_ITEMS.map((item) => (
            <button key={item.num} onClick={() => goToItem(item.num)} className={`text-xs py-1 rounded ${
              currentItem === item.num ? 'bg-blue-600 text-white' :
              responses[item.num] !== undefined ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
              {item.num}
            </button>
          ))}
        </div>
      </div>

      {responses[9] !== undefined && responses[9] >= 1 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ Ítem 9 (ideación suicida): nivel {responses[9]}/3. Requiere evaluación de riesgo.
        </div>
      )}
    </div>
  )
}