'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { COOPERSMITH_ITEMS, type CooperResponse } from '@/lib/coopersmith/engine'
import { finishEvaluation } from './finish'

interface CoopersmithControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: CooperResponse) => void
}

export function CoopersmithControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse }: CoopersmithControlProps) {
  const router = useRouter()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<Record<number, CooperResponse>>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)

  const currentItemData = COOPERSMITH_ITEMS.find(item => item.num === currentItem)
  const allDone = completed === 58

  const handleResponse = (value: CooperResponse) => {
    const newResponses = { ...responses, [currentItem]: value }
    setResponses(newResponses)
    setCompleted(Object.keys(newResponses).length)
    onSaveResponse(currentItem, value)

    // Actualizar pantalla del paciente
    onUpdatePatient({
      type: 'coopersmith',
      item: currentItem,
      text: currentItemData?.text,
      options: ['Igual que yo', 'No es como yo'],
      selected: value,
      totalCompleted: Object.keys(newResponses).length,
      totalItems: 58
    })
  }

  const goToNext = () => {
    if (currentItem < 58) {
      setCurrentItem(currentItem + 1)
      const nextItem = COOPERSMITH_ITEMS.find(item => item.num === currentItem + 1)
      onUpdatePatient({
        type: 'coopersmith',
        item: currentItem + 1,
        text: nextItem?.text,
        options: ['Igual que yo', 'No es como yo'],
        selected: responses[currentItem + 1],
        totalCompleted: completed,
        totalItems: 58
      })
    }
  }

  const goToPrev = () => {
    if (currentItem > 1) {
      setCurrentItem(currentItem - 1)
      const prevItem = COOPERSMITH_ITEMS.find(item => item.num === currentItem - 1)
      onUpdatePatient({
        type: 'coopersmith',
        item: currentItem - 1,
        text: prevItem?.text,
        options: ['Igual que yo', 'No es como yo'],
        selected: responses[currentItem - 1],
        totalCompleted: completed,
        totalItems: 58
      })
    }
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    const item = COOPERSMITH_ITEMS.find(i => i.num === num)
    onUpdatePatient({
      type: 'coopersmith',
      item: num,
      text: item?.text,
      options: ['Igual que yo', 'No es como yo'],
      selected: responses[num],
      totalCompleted: completed,
      totalItems: 58
    })
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)
    await finishEvaluation({
      dualSessionId,
      sessionId,
      responses,
      router
    })
  }

  const currentResponse = responses[currentItem]

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progreso</span>
          <span className="text-gray-800 font-medium">{completed}/58 ítems</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${(completed / 58) * 100}%` }}
          />
        </div>
      </div>

      {/* Ítem actual */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
            Ítem {currentItem}/58
          </span>
          {currentResponse && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              Respondido
            </span>
          )}
        </div>
        <p className="text-gray-800 text-base leading-relaxed mb-4">
          {currentItemData?.text}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleResponse('igual')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              currentResponse === 'igual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ Igual que yo
          </button>
          <button
            onClick={() => handleResponse('diferente')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              currentResponse === 'diferente'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✗ No es como yo
          </button>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex gap-3">
        <button
          onClick={goToPrev}
          disabled={currentItem === 1}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={goToNext}
          disabled={currentItem === 58}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Siguiente →
        </button>
      </div>

      {/* Botón finalizar */}
      {allDone && (
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {finishing ? 'Finalizando...' : '✓ Finalizar evaluación'}
        </button>
      )}

      {/* Índice rápido */}
      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-2">Ir a ítem:</p>
        <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
          {COOPERSMITH_ITEMS.map((item) => (
            <button
              key={item.num}
              onClick={() => goToItem(item.num)}
              className={`text-xs py-1 rounded transition-all ${
                currentItem === item.num
                  ? 'bg-blue-600 text-white'
                  : responses[item.num]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {item.num}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}