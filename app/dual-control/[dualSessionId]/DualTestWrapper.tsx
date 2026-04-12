'use client'
// app/dual-control/[dualSessionId]/DualTestWrapper.tsx
// FIX #2: La distancia excesiva entre el contenido y la navegación rápida
// se debía a que h-screen/100dvh con flex-col hacía que el área de contenido
// ocupara todo el espacio disponible aunque el contenido fuera pequeño.
// Solución: usar posición fija para la barra de navegación (bottom: 0),
// y paddingBottom en el contenido para que no quede tapado.

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
          <button
            onClick={() => onStart?.()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Comenzar evaluación
          </button>
        </div>
      </div>
    )
  }

  // Altura estimada de la barra de navegación: ~76px
  const NAV_HEIGHT = 76

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Contenido — padding inferior para que no quede tapado por la barra fija */}
      <div className="p-3" style={{ paddingBottom: NAV_HEIGHT + 12 }}>
        {children}
      </div>

      {/* Navegación rápida — FIJA al fondo de la pantalla, siempre visible */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20"
        style={{ paddingTop: 8, paddingBottom: 10, paddingLeft: 12, paddingRight: 12 }}
      >
        <p className="text-xs text-gray-500 mb-1.5 text-center">
          📋 {completed}/{totalItems} respondidos — toca un número para navegar
        </p>
        <div className="flex flex-wrap justify-center gap-1 max-h-16 overflow-y-auto">
          {items.map((item) => {
            const isAnswered = answeredItems ? answeredItems.has(item.num) : false
            const isCurrent = currentItem === item.num
            return (
              <button
                key={item.num}
                onClick={() => onItemSelect(item.num)}
                className={`w-7 h-7 text-xs font-medium rounded-full transition-all flex-shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
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
