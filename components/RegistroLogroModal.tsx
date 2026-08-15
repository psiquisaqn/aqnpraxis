// components/RegistroLogroModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { ACHIEVEMENT_SCALE } from '@/lib/activities/all-sessions'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    domainScores: Record<string, number>
    observations: string
    nextSessionNotes: string
  }) => void
  achievementDomains: string[] // los dominios de la sesión actual
  isSubmitting?: boolean
}

export function RegistroLogroModal({
  isOpen,
  onClose,
  onSave,
  achievementDomains,
  isSubmitting = false,
}: Props) {
  const [domainScores, setDomainScores] = useState<Record<string, number>>({})
  const [observations, setObservations] = useState('')
  const [nextSessionNotes, setNextSessionNotes] = useState('')

  // Inicializar los dominios con nivel 1 por defecto
  useEffect(() => {
    if (achievementDomains.length > 0) {
      const initial = achievementDomains.reduce((acc, domain) => {
        acc[domain] = 1
        return acc
      }, {} as Record<string, number>)
      setDomainScores(initial)
    } else {
      // Si no hay dominios, usamos un campo general
      setDomainScores({ 'Nivel general': 1 })
    }
  }, [achievementDomains])

  const handleDomainChange = (domain: string, value: number) => {
    setDomainScores(prev => ({ ...prev, [domain]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      domainScores,
      observations,
      nextSessionNotes,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Registrar logro</h2>
        <form onSubmit={handleSubmit}>
          {/* Dominios */}
          <div className="space-y-4">
            {Object.keys(domainScores).length === 0 ? (
              <p className="text-sm text-gray-500">No hay dominios definidos para esta sesión.</p>
            ) : (
              Object.keys(domainScores).map((domain) => (
                <div key={domain} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium w-40 flex-shrink-0">{domain}</label>
                  <select
                    value={domainScores[domain]}
                    onChange={(e) => handleDomainChange(domain, parseInt(e.target.value))}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  >
                    {ACHIEVEMENT_SCALE.map((item) => (
                      <option key={item.level} value={item.level}>
                        {item.level} – {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>

          {/* Observaciones */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Comentarios sobre el desempeño del evaluado..."
            />
          </div>

          {/* Notas para siguiente sesión */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Notas para la siguiente sesión</label>
            <textarea
              value={nextSessionNotes}
              onChange={(e) => setNextSessionNotes(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={2}
              placeholder="Indicaciones o temas a retomar en la próxima sesión..."
            />
          </div>

          {/* Botones */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar logro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}