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
      <div className="flex flex-col h-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {title}
          </h2>
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-blue-800 text-lg">
              Para iniciar, haz clic en la primera pregunta para que se vea en la pantalla del paciente
            </p>
          </div>
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Comenzar evaluación
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        {children}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 bg-white sticky bottom-0">
        <p className="text-xs text-gray-500 mb-2">
          Navegación rápida ({completed}/{totalItems} respondidos)
        </p>
        <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.num}
              onClick={() => onItemSelect(item.num)}
              className={`text-xs py-1 rounded transition-colors ${
                currentItem === item.num
                  ? "bg-blue-600 text-white"
                  : completed >= item.num
                  ? "bg-green-100 text-green-700"
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