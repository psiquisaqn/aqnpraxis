'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DualSessionButtonProps {
  patientId: string
}

export function DualSessionButton({ patientId }: DualSessionButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    // Redirigir a la página de nueva sesión dual
    router.push(`/dashboard/paciente/${patientId}/nueva-sesion-dual`)
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1" stroke="white" strokeWidth="1.2"/>
        <path d="M5 1v2M11 1v2M3 6h10" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="8" cy="9" r="1" fill="white"/>
      </svg>
      {loading ? 'Iniciando...' : 'Evaluación dual'}
    </button>
  )
}