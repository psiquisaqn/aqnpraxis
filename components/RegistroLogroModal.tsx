'use client'

import { useState, useEffect } from 'react'
import { ACHIEVEMENT_SCALE } from '@/lib/activities/all-sessions'
import type { PdpiActivity } from '@/lib/activities/all-sessions'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    activityScores: Record<string, number> // clave = step (a,b,c,d,e) → nivel 1-6
    observations: string
    nextSessionNotes: string
  }) => void
  activities: PdpiActivity[] // las actividades de la sesión actual
  isSubmitting?: boolean
}

export function RegistroLogroModal({
  isOpen,
  onClose,
  onSave,
  activities,
  isSubmitting = false,
}: Props) {
  const [activityScores, setActivityScores] = useState<Record<string, number>>({})
  const [observations, setObservations] = useState('')
  const [nextSessionNotes, setNextSessionNotes] = useState('')

  // Inicializar los niveles: cada actividad comienza en nivel 1
  useEffect(() => {
    if (activities.length > 0) {
      const initial = activities.reduce((acc, act) => {
        acc[act.step] = 1
        return acc
      }, {} as Record<string, number>)
      setActivityScores(initial)
    } else {
      // Si no hay actividades, usamos un campo general
      setActivityScores({ general: 1 })
    }
  }, [activities])

  const handleActivityChange = (step: string, value: number) => {
    setActivityScores(prev => ({ ...prev, [step]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      activityScores,
      observations,
      nextSessionNotes,
    })
  }

  if (!isOpen) return null

  // Determinar si usamos el modo "actividades" o "general"
  const useGeneral = activities.length === 0
  const displayKeys = useGeneral ? ['general'] : activities.map(a => a.step)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Registrar logro</h2>
        <form onSubmit={handleSubmit}>
          {/* Niveles por actividad */}
          <div className="space-y-4">
            {useGeneral ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium w-40 flex-shrink-0">Nivel general</label>
                <select
                  value={activityScores.general || 1}
                  onChange={(e) => handleActivityChange('general', parseInt(e.target.value))}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                >
                  {ACHIEVEMENT_SCALE.map((item) => (
                    <option key={item.level} value={item.level}>
                      {item.level} – {item.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.step} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium w-40 flex-shrink-0">
                    {act.step}. {act.label}
                  </label>
                  <select
                    value={activityScores[act.step] || 1}
                    onChange={(e) => handleActivityChange(act.step, parseInt(e.target.value))}
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
              placeholder="Comentarios sobre el desempeño del evaluado en cada actividad..."
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