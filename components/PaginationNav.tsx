'use client'

interface PaginationNavProps {
  currentPage: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  isMobile?: boolean
}

export function PaginationNav({ currentPage, totalPages, onPrev, onNext, isMobile = false }: PaginationNavProps) {
  return (
    <div className="flex items-center justify-between gap-3 mt-6">
      <button
        onClick={onPrev}
        disabled={currentPage === 0}
        className="flex-1 text-sm py-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 transition-colors hover:bg-gray-50"
      >
        ← Anterior
      </button>
      {!isMobile && (
        <div className="text-xs text-gray-400">
          Página {currentPage + 1} de {totalPages}
        </div>
      )}
      <button
        onClick={onNext}
        disabled={currentPage === totalPages - 1}
        className="flex-1 text-sm py-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 transition-colors hover:bg-gray-50"
      >
        Siguiente →
      </button>
    </div>
  )
}
