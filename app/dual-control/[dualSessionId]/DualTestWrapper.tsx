'use client'
// app/dual-control/[dualSessionId]/DualTestWrapper.tsx
// FIX #2/#3/#4 (layout dual-control): La barra de navegación rápida quedaba
// muy abajo porque el contenedor usaba h-screen con flex, pero el contenido
// principal no tenía altura limitada. Se usa un layout más compacto donde:
// - El área de contenido (children) tiene overflow-y-auto
// - La navegación rápida está pegada justo debajo, SIN espacio extra
// - Los botones Anterior/Siguiente están DENTRO de children (en cada test)
//   y la navegación rápida queda fija al fondo

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

  return (
    // FIX: usar 100dvh para respetar la barra del navegador en móvil
    <div style={{ height: '100dvh' }} className="flex flex-col bg-gray-100 overflow-hidden">

      {/* Área de contenido — ocupa todo el espacio disponible, con scroll interno */}
      <div className="flex-1 overflow-y-auto p-3">
        {children}
      </div>

      {/* Navegación rápida — pegada al fondo, tamaño fijo y compacto */}
      <div className="bg-white border-t border-gray-200 shadow-lg flex-shrink-0 px-3 pt-2 pb-3">
        <p className="text-xs text-gray-500 mb-1.5 text-center">
          📋 Navegación rápida — {completed}/{totalItems} respondidos
        </p>
        {/* max-h-16 = ~2 filas de botones, scrolleable si hay muchos ítems */}
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
