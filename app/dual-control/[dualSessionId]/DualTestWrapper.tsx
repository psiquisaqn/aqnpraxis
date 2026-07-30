'use client'

import { ReactNode } from 'react'

interface DualTestWrapperProps {
  title: string
  totalItems: number
  currentItem: number
  completed: number
  onItemSelect?: (num: number) => void
  items?: Array<{ num: number }>
  answeredItems?: Set<number>
  showQuestionZero: boolean
  onStart: () => void
  children: ReactNode
  hideNavigation?: boolean
}

export function DualTestWrapper({
  title,
  totalItems,
  currentItem,
  completed,
  onItemSelect = () => {},
  items = [],
  answeredItems = new Set(),
  showQuestionZero,
  onStart,
  children,
  hideNavigation = false
}: DualTestWrapperProps) {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {showQuestionZero ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">
              Consulta al evaluado si está listo para responder las preguntas.
              <br />
              Cuando esté preparado, presiona el botón para comenzar.
            </p>
            <button
              onClick={onStart}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Comenzar evaluación
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Contenido del test (arriba) */}
            <div className="w-full">
              {children}
            </div>

            {/* Navegación (abajo) - ultra compacta */}
            {!hideNavigation && items.length > 0 && (
              <div className="w-full">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progreso</span>
                    <span className="text-gray-800 font-medium">{completed}/{totalItems}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completed/totalItems)*100}%` }} />
                  </div>
                  <div className="grid grid-cols-10 gap-0.5 max-h-[140px] overflow-y-auto">
                    {items.map((item) => (
                      <button
                        key={item.num}
                        onClick={() => onItemSelect(item.num)}
                        className={`text-[8px] h-6 py-0.5 px-0.5 rounded transition-colors ${
                          item.num === currentItem
                            ? 'bg-blue-600 text-white'
                            : answeredItems.has(item.num)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item.num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}