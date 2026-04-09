'use client'
// app/dual-control/[dualSessionId]/DualTestWrapper.tsx
// FIX #4: La lógica de "completed >= item.num" para colorear los botones de
// navegación era incorrecta — usaba >= en vez de verificar si esa clave existe
// en responses. Esto afectaba la visualización pero no el conteo.
//
// El bug real del botón Finalizar que no aparece está en los controles individuales
// (coopersmith.tsx, peca.tsx, bdi2.tsx): el estado "completed" se calcula con
// Object.keys(newResponses).length DENTRO de handleResponse, pero si el usuario
// navega atrás y corrige una respuesta ya existente, no suma — ya está contado.
// Sin embargo, si el estado "responses" se inicializa vacío y "completed" se
// sincroniza con él via useEffect en vez de inline, puede quedar desincronizado.
//
// La corrección aquí: usar Object.keys(responses).length directamente como
// computed value en vez de un state separado para "completed". Esto se hace
// en los controles individuales (ver fix_04b). En este wrapper solo corregimos
// la visualización del índice de navegación.

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
  // nuevo: set de ítems respondidos para colorear correctamente
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
  const handleStart = () => {
    if (onStart) onStart()
  }

  if (showQuestionZero) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <p className="text-blue-800 text-base">
                Para iniciar, haz clic en el botón para que el primer ítem se vea en la pantalla del paciente
              </p>
            </div>
            <button
              onClick={handleStart}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Comenzar evaluación
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Contenido principal con scroll */}
      <div className="flex-1 overflow-y-auto p-4 pb-2">
        {children}
      </div>

      {/* Navegación fija inferior */}
      <div className="bg-white border-t border-gray-200 p-3 shadow-lg flex-shrink-0">
        <p className="text-xs text-gray-500 mb-2 text-center">
          📋 Navegación rápida ({completed}/{totalItems} respondidos)
        </p>
        <div className="flex flex-wrap justify-center gap-1 max-h-24 overflow-y-auto">
          {items.map((item) => {
            // FIX: usar el Set de ítems respondidos si está disponible,
            // si no, mantener comportamiento anterior (compatible con versión vieja)
            const isAnswered = answeredItems
              ? answeredItems.has(item.num)
              : false
            const isCurrent = currentItem === item.num

            return (
              <button
                key={item.num}
                onClick={() => onItemSelect(item.num)}
                className={`w-8 h-8 text-xs font-medium rounded-full transition-all flex-shrink-0 ${
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
