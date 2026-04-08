'use client'

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
  items
}: DualTestWrapperProps) {
  const handleStart = () => {
    if (onStart) onStart()
  }

  if (showQuestionZero) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {title}
            </h2>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <p className="text-blue-800 text-base">
                Para iniciar, haz clic en la primera pregunta para que se vea en la pantalla del paciente
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

      {/* Botonera fija en la parte inferior - SIN SCROLL */}
      <div className="bg-white border-t border-gray-200 p-3 shadow-lg flex-shrink-0">
        <p className="text-xs text-gray-500 mb-2 text-center">
          📋 Navegación rápida ({completed}/{totalItems} respondidos)
        </p>
        <div className="flex flex-wrap justify-center gap-1 max-h-24 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.num}
              onClick={() => onItemSelect(item.num)}
              className={`w-8 h-8 text-xs font-medium rounded-full transition-all flex-shrink-0 ${
                currentItem === item.num
                  ? "bg-blue-600 text-white ring-2 ring-blue-300"
                  : completed >= item.num
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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