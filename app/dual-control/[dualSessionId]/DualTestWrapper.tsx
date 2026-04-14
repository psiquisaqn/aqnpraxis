'use client'
// app/dual-control/[dualSessionId]/DualTestWrapper.tsx
// FIX #1: El panel de navegación era demasiado estrecho (max-h-16) y requería
// scroll interno para ver todos los ítems. Se aumenta a max-h-28 (~4 filas)
// y se ajusta el paddingBottom del contenido para compensar.

import { ReactNode } from 'react'

interface DualTestWrapperProps {
  title: string
  children: ReactNode
  showQuestionZero?: boolean
  onStart?: () => void
  totalItems: number
  currentItem: number
  completed: number
  onItemSelect: (itemNum: number) => void
  items: Array<{ num: number; label?: string }>
  answeredItems?: Set<number>
}

export function DualTestWrapper({
  title,
  children,
  showQuestionZero = true,
  onStart,
  totalItems,
  currentItem,
  completed,
  onItemSelect,
  items,
  answeredItems,
}: DualTestWrapperProps) {
  if (showQuestionZero) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-blue-800 text-base">
              Para iniciar, haz clic en el botón para que el primer ítem se vea en la pantalla del paciente
            </p>
          </div>
          <button onClick={() => onStart?.()} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Comenzar evaluación
          </button>
        </div>
      </div>
    )
  }

  // Altura de la barra de navegación: título(20) + botones hasta 4 filas(4×32=128) + padding(20) = ~168px
  const NAV_HEIGHT = 170

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Contenido con padding inferior para no quedar tapado */}
      <div className="p-3" style={{ paddingBottom: NAV_HEIGHT + 8 }}>
        {children}
      </div>

      {/* Barra de navegación fija al fondo */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20"
        style={{ padding: '8px 12px 12px' }}
      >
        <p className="text-xs text-gray-500 mb-2 text-center font-medium">
          Navegación rápida — {completed}/{totalItems} respondidos
        </p>
        {/* max-h-28 = ~4 filas de botones de 28px, sin scroll interno en la mayoría de casos */}
        <div className="flex flex-wrap justify-center gap-1 overflow-y-auto" style={{ maxHeight: 120 }}>
          {items.map((item) => {
            const isAnswered = answeredItems ? answeredItems.has(item.num) : false
            const isCurrent = currentItem === item.num
            return (
              <button
                key={item.num}
                onClick={() => onItemSelect(item.num)}
                className={`flex-shrink-0 text-xs font-medium rounded-full transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                style={{ width: 28, height: 28 }}
              >
                {item.num}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
