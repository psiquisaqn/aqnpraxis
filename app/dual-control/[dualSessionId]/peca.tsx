'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PECA_ITEMS, scorePeca, type PecaResponses } from '@/lib/peca/engine'

interface PecaControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: 1 | 2 | 3 | 4) => void
}

const RESPONSE_OPTIONS = [
  { value: 1, label: '1 - Siempre la izquierda' },
  { value: 2, label: '2 - Generalmente la izquierda' },
  { value: 3, label: '3 - Generalmente la derecha' },
  { value: 4, label: '4 - Siempre la derecha' },
]

export function PecaControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse }: PecaControlProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<PecaResponses>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [displayReady, setDisplayReady] = useState(false)

  const currentItemData = PECA_ITEMS.find(item => item.num === currentItem)
  const allDone = completed === 45

  useEffect(() => {
    const handleDisplayReady = () => {
      setDisplayReady(true)
    }
    window.addEventListener('display_ready', handleDisplayReady)
    return () => window.removeEventListener('display_ready', handleDisplayReady)
  }, [])

  const sendCurrentItemToDisplay = () => {
    const itemData = PECA_ITEMS.find(item => item.num === currentItem)
    if (itemData) {
      onUpdatePatient({
        type: 'peca',
        item: currentItem,
        leftPhrase: itemData.leftPhrase,
        rightPhrase: itemData.rightPhrase,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem],
        totalCompleted: completed,
        totalItems: 45
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

  const handleResponse = (value: 1 | 2 | 3 | 4) => {
    const newResponses = { ...responses, [currentItem]: value }
    setResponses(newResponses)
    setCompleted(Object.keys(newResponses).length)
    onSaveResponse(currentItem, value)

    onUpdatePatient({
      type: 'peca',
      item: currentItem,
      leftPhrase: currentItemData?.leftPhrase,
      rightPhrase: currentItemData?.rightPhrase,
      options: RESPONSE_OPTIONS,
      selected: value,
      totalCompleted: Object.keys(newResponses).length,
      totalItems: 45
    })
  }

  const goToNext = () => {
    if (currentItem < 45) {
      setCurrentItem(currentItem + 1)
      const nextItem = PECA_ITEMS.find(item => item.num === currentItem + 1)
      onUpdatePatient({
        type: 'peca',
        item: currentItem + 1,
        leftPhrase: nextItem?.leftPhrase,
        rightPhrase: nextItem?.rightPhrase,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem + 1],
        totalCompleted: completed,
        totalItems: 45
      })
    }
  }

  const goToPrev = () => {
    if (currentItem > 1) {
      setCurrentItem(currentItem - 1)
      const prevItem = PECA_ITEMS.find(item => item.num === currentItem - 1)
      onUpdatePatient({
        type: 'peca',
        item: currentItem - 1,
        leftPhrase: prevItem?.leftPhrase,
        rightPhrase: prevItem?.rightPhrase,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem - 1],
        totalCompleted: completed,
        totalItems: 45
      })
    }
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    const item = PECA_ITEMS.find(i => i.num === num)
    onUpdatePatient({
      type: 'peca',
      item: num,
      leftPhrase: item?.leftPhrase,
      rightPhrase: item?.rightPhrase,
      options: RESPONSE_OPTIONS,
      selected: responses[num],
      totalCompleted: completed,
      totalItems: 45
    })
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)

    const result = scorePeca(responses)

    const itemCols: Record<string, number> = {}
    for (let i = 1; i <= 45; i++) {
      if (responses[i] !== undefined) {
        itemCols[`item_${i}`] = responses[i]
      }
    }

    const { error: scoreError } = await supabase
      .from('peca_scores')
      .upsert({
        session_id: sessionId,
        ...itemCols,
        answered_items: result.answeredItems,
        is_complete: true,
        participation_level: result.participationLevel,
        participation_needs: result.participationNeeds,
        dimensions_summary: result.dimensions,
        aamr_summary: result.aamrSets,
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
        test_id: 'peca',
        status: 'completed',
        result: result,
        completed_at: new Date().toISOString(),
        responses: responses
      }, { onConflict: 'dual_session_id' })

    router.push(`/resultados/peca?session=${sessionId}`)
  }

  const currentResponse = responses[currentItem]

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progreso</span>
          <span className="text-gray-800 font-medium">{completed}/45 ítems</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completed / 45) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">Ítem {currentItem}/45</span>
          {currentResponse !== undefined && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Respondido</span>}
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-700 flex-1">{currentItemData?.leftPhrase}</span>
          <span className="text-gray-500 mx-2">← →</span>
          <span className="text-gray-700 flex-1 text-right">{currentItemData?.rightPhrase}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {RESPONSE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleResponse(opt.value as 1 | 2 | 3 | 4)}
              className={`px-3 py-2 rounded-lg border text-sm ${
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
        <button onClick={goToNext} disabled={currentItem === 45} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">Siguiente →</button>
      </div>

      {allDone && (
        <button onClick={handleFinish} disabled={finishing} className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
          {finishing ? 'Finalizando...' : '✓ Finalizar evaluación'}
        </button>
      )}

      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-2">Ir a ítem:</p>
        <div className="grid grid-cols-9 gap-1 max-h-32 overflow-y-auto">
          {PECA_ITEMS.map((item) => (
            <button key={item.num} onClick={() => goToItem(item.num)} className={`text-xs py-1 rounded ${
              currentItem === item.num ? 'bg-blue-600 text-white' :
              responses[item.num] !== undefined ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
              {item.num}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}