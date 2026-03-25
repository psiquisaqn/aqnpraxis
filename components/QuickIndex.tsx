'use client'

interface QuickIndexProps {
  totalItems: number
  currentIndex: number
  responses: Record<number, any>
  onSelect: (index: number) => void
  className?: string
}

export function QuickIndex({ totalItems, currentIndex, responses, onSelect, className = '' }: QuickIndexProps) {
  const getItemColor = (num: number) => {
    if (responses[num]) return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">
        Índice rápido
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {Array.from({ length: totalItems }, (_, i) => {
          const num = i + 1
          return (
            <button
              key={num}
              onClick={() => onSelect(i)}
              className={`text-xs w-7 h-7 rounded flex items-center justify-center transition-all ${
                getItemColor(num)
              } ${currentIndex === i ? 'ring-2 ring-blue-500 font-bold' : ''}`}
            >
              {num}
            </button>
          )
        })}
      </div>
    </div>
  )
}
