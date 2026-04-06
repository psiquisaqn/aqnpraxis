'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PECA_ITEMS, type PecaResponses } from '@/lib/peca/engine'

interface PecaControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}

export function PecaControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }: PecaControlProps) {
  const router = useRouter()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<PecaResponses>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const firstItemSent = useRef(false)

  const currentItemData = PECA_ITEMS.find(item => item.num === currentItem)
  const allDone = completed === 45

  const buildPayload = (num: number, sel?: number) => {
    const d = PECA_ITEMS.find(i => i.num === num)
    return {
      type: 'peca', item: num,
      leftPhrase: d?.leftPhrase,
      rightPhrase: d?.rightPhrase,
      options: [
        { value: 1, label: '1 - Muy parecido a la izquierda' },
        { value: 2, label: '2 - Algo parecido a la izquierda' },
        { value: 3, label: '3 - Algo parecido a la derecha' },
        { value: 4, label: '4 - Muy parecido a la derecha' },
      ],
      selected: sel,
      totalCompleted: completed,
      totalItems: 45
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

  // Reenviar item cuando display se conecta
  useEffect(() => {
    if (displayReady) {
      onUpdatePatient(buildPayload(currentItem, responses[currentItem] as number | undefined))
      firstItemSent.current = true
    }
  }, [displayReady])

  const handleResponse = (value: number) => {
    const newResponses = { ...responses, [currentItem]: value as 1|2|3|4 }
    setResponses(newResponses)
    const newCompleted = Object.keys(newResponses).length
    setCompleted(newCompleted)
    onSaveResponse(currentItem, value)
    onUpdatePatient({ ...buildPayload(currentItem, value), totalCompleted: newCompleted })
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    onUpdatePatient(buildPayload(num, responses[num] as number | undefined))
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)
    try {
      const { scorePeca } = await import('@/lib/peca/engine')
      const result = scorePeca(responses)
      const { supabase } = await import('@/lib/supabase/client')

      // Mapear respuestas a columnas p01-p45
      const itemCols: Record<string, number> = {}
      for (let i = 1; i <= 45; i++) {
        const key = 'p' + String(i).padStart(2, '0')
        if (responses[i] !== undefined) itemCols[key] = responses[i] as number
      }

      // Mapear dimensiones
      const dimMap: Record<string, any> = {}
      result.dimensions.forEach((d: any) => {
        dimMap['score_' + d.code] = d.p2
        dimMap['level_' + d.code] = d.intensity
      })

      // Mapear AAMR sets
      const aamrMap: Record<string, number> = {}
      result.aamrSets.forEach((s: any) => {
        aamrMap['h' + s.code.slice(0,3)] = s.p2
        aamrMap['h' + s.code.slice(0,3) + '_level'] = s.needsSupport ? 'needs_support' : 'ok'
      })

      const { error } = await supabase
        .from('peca_scores')
        .upsert({
          session_id: sessionId,
          ...itemCols,
          ...dimMap,
          ...aamrMap,
          participation_level: result.participationLevel,
          completed_items: result.answeredItems,
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
          <span className="text-gray-800 font-medium">{completed}/45 items</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: ((completed/45)*100) + "%" }} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">Item {currentItem}/45</span>
          {responses[currentItem] && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Respondido</span>}
        </div>
        <div className="flex justify-between gap-4 mb-4 text-sm">
          <span className="flex-1 text-left text-gray-700 font-medium">{currentItemData?.leftPhrase}</span>
          <span className="text-gray-400">vs</span>
          <span className="flex-1 text-right text-gray-700 font-medium">{currentItemData?.rightPhrase}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map((val) => (
            <button key={val} onClick={() => handleResponse(val)}
              className={`py-2 rounded-lg font-medium text-sm transition-all ${responses[currentItem] === val ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >{val}</button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
          <span>Izquierda</span><span>Derecha</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => goToItem(Math.max(1, currentItem-1))} disabled={currentItem===1}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
          Anterior
        </button>
        <button onClick={() => goToItem(Math.min(45, currentItem+1))} disabled={currentItem===45}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
          Siguiente
        </button>
      </div>

      {allDone && (
        <button onClick={handleFinish} disabled={finishing}
          className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
          {finishing ? 'Finalizando...' : 'Finalizar evaluacion PECA'}
        </button>
      )}

      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-2">Ir a item:</p>
        <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
          {PECA_ITEMS.map((item) => (
            <button key={item.num} onClick={() => goToItem(item.num)}
              className={`text-xs py-1 rounded ${currentItem===item.num ? "bg-blue-600 text-white" : responses[item.num] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {item.num}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}