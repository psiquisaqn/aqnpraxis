// app/dashboard/paciente/[id]/actividades/[programa]/page.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useActivity } from '@/hooks/useActivity'
import { RegistroLogroModal } from '@/components/RegistroLogroModal'
import { ACHIEVEMENT_SCALE } from '@/lib/activities/all-sessions'

export default function ProgramaPage() {
  // Obtener parámetros de la URL
  const { id: patientId, programa } = useParams() as { id: string; programa: string }

  // Aquí deberías obtener el ID del psicólogo desde el contexto de autenticación
  // Por ahora lo dejamos fijo (ejemplo)
  const psychologistId = '...' // Reemplazar con el ID real

  // Hook de actividades
  const {
    loading,
    error,
    sessions,
    progress,
    currentSession,
    currentSessionData,
    totalSessions,
    nextSessionNumber,
    isComplete,
    startNewSession,
    submitAchievement,
    skipSession,
  } = useActivity(patientId, psychologistId, programa as any)

  // Estado del modal
  const [showModal, setShowModal] = useState(false)

  // Manejador para guardar el logro desde el modal
  const handleSaveAchievement = async (data: {
    domainScores: Record<string, number>
    observations: string
    nextSessionNotes: string
  }) => {
    await submitAchievement(data)
    setShowModal(false)
  }

  // ============================================================
  // RENDERIZADO
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ======== CABECERA ======== */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Programa {programa}</h1>
        <div className="text-sm text-gray-600">
          {progress?.sessions_completed || 0} / {totalSessions} sesiones completadas
        </div>
      </div>

      {/* ======== PROGRESO ======== */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          {progress?.avg_achievement && (
            <span>Promedio de logro: {progress.avg_achievement}</span>
          )}
          <span>Última sesión: {progress?.last_session ?? 'Ninguna'}</span>
        </div>
        {/* Barra de progreso */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{
              width: `${Math.min((progress?.sessions_completed || 0) / totalSessions * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* ======== SESIÓN ACTUAL O INICIO ======== */}
      {isComplete ? (
        <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
          <p className="text-xl font-semibold text-green-700">🎉 ¡Programa completado!</p>
          <p className="text-sm text-green-600 mt-2">Has finalizado todas las sesiones de este programa.</p>
        </div>
      ) : currentSessionData ? (
        // ---------- SESIÓN EN PROGRESO ----------
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Sesión {currentSessionData.id}: {currentSessionData.element}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{currentSessionData.objective}</p>
            </div>
            <span className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              En progreso
            </span>
          </div>

          {/* Actividades */}
          <div className="mt-4 space-y-3">
            {currentSessionData.activities.map((act) => (
              <div key={act.step} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 w-6 flex-shrink-0">{act.step}.</span>
                  <div>
                    <strong>{act.label}</strong>
                    <p className="text-sm text-gray-700">{act.instruction}</p>
                    {act.psychologist_note && (
                      <p className="text-xs text-gray-400 mt-1">📝 {act.psychologist_note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Registrar logro
            </button>
            <button
              onClick={skipSession}
              className="px-5 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition"
            >
              Saltar sesión
            </button>
          </div>
        </div>
      ) : (
        // ---------- INICIAR PRÓXIMA SESIÓN ----------
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-lg font-medium">
            Próxima sesión: <span className="text-blue-600">{nextSessionNumber}</span>
          </p>
          <button
            onClick={startNewSession}
            className="mt-4 px-6 py-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
          >
            Iniciar sesión {nextSessionNumber}
          </button>
        </div>
      )}

      {/* ======== HISTORIAL DE SESIONES ======== */}
      <div className="mt-8">
        <h3 className="font-semibold text-lg mb-3">Historial de sesiones</h3>
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No hay sesiones registradas.</p>
          ) : (
            sessions.map((s) => {
              // Buscar el registro de logro para esta sesión (si existe)
              // Podríamos tenerlo en un estado aparte, pero por ahora solo mostramos el estado
              const statusLabels: Record<string, { label: string; className: string }> = {
                completed: { label: 'Completada', className: 'bg-green-100 text-green-800' },
                in_progress: { label: 'En progreso', className: 'bg-yellow-100 text-yellow-800' },
                skipped: { label: 'Saltada', className: 'bg-gray-100 text-gray-800' },
                pending: { label: 'Pendiente', className: 'bg-blue-100 text-blue-800' },
              }
              const statusInfo = statusLabels[s.status] || statusLabels.pending
              return (
                <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium">Sesión {s.session_number}</span>
                  <span className={`text-xs px-3 py-1 rounded-full ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ======== MODAL DE REGISTRO DE LOGRO ======== */}
      <RegistroLogroModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveAchievement}
        achievementDomains={currentSessionData?.achievement_domains || []}
        isSubmitting={loading}
      />
    </div>
  )
}