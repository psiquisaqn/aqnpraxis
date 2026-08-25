// hooks/useActivity.ts
import { useState, useEffect, useCallback } from 'react'
import {
  getProgramSessions,
  getPatientSessions,
  getProgramProgress,
  getOrCreateSession,
  recordAchievement,
  updateSessionStatus,
  getNextAvailableSessionNumber,
  type ProgramCode,
  type ActivitySessionDB,
  type ProgramProgress,
  type AchievementRecordDB,
} from '@/lib/supabase/activities'
import { type PdpiSession } from '@/lib/activities'

// ====================================================================
// INTERFAZ DE RETORNO DEL HOOK
// ====================================================================

interface UseActivityReturn {
  loading: boolean
  error: string | null
  sessions: ActivitySessionDB[]
  progress: ProgramProgress | null
  currentSession: ActivitySessionDB | null
  currentSessionData: PdpiSession | null
  totalSessions: number
  nextSessionNumber: number
  isComplete: boolean
  startNewSession: () => Promise<void>
  submitAchievement: (data: {
    activityScores: Record<string, number>
    observations?: string
    nextSessionNotes?: string
  }) => Promise<void>
  skipSession: () => Promise<void>
  refresh: () => Promise<void>
}

// ====================================================================
// FUNCIÓN AUXILIAR PARA VALIDAR UUID
// ====================================================================
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// ====================================================================
// HOOK PRINCIPAL
// ====================================================================

export function useActivity(
  patientId: string,
  psychologistId: string,
  programCode: ProgramCode
): UseActivityReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ActivitySessionDB[]>([])
  const [progress, setProgress] = useState<ProgramProgress | null>(null)
  const [currentSession, setCurrentSession] = useState<ActivitySessionDB | null>(null)
  const [currentSessionData, setCurrentSessionData] = useState<PdpiSession | null>(null)
  const [nextSessionNumber, setNextSessionNumber] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const totalSessions = getProgramSessions(programCode).length

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  const loadData = useCallback(async () => {
    if (!patientId || !psychologistId) {
      setError('Faltan datos del paciente o psicólogo')
      return
    }
    if (!isValidUUID(psychologistId)) {
      setError(`ID del psicólogo inválido: "${psychologistId}"`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Obtener todas las sesiones del paciente
      const patientSessions = await getPatientSessions(patientId, programCode)
      setSessions(patientSessions)

      // 2. Obtener progreso
      const prog = await getProgramProgress(patientId, programCode)
      setProgress(prog)

      // 3. Obtener siguiente número disponible
      const next = await getNextAvailableSessionNumber(patientId, programCode)
      setNextSessionNumber(next)
      setIsComplete(next >= totalSessions)

      // 4. Buscar sesión en progreso
      let inProgress = patientSessions.find(s => s.status === 'in_progress')

      // 5. Si existe en progreso pero su número no tiene datos estáticos, marcar como skipped
      if (inProgress) {
        const sessionData = getProgramSessions(programCode).find(s => s.id === inProgress.session_number)
        if (!sessionData) {
          // La sesión tiene un número inválido (ej. 0 para TP-CREM)
          console.warn(`⚠️ Sesión en progreso con número inválido (${inProgress.session_number}) para ${programCode}. Marcando como 'skipped'.`)
          await updateSessionStatus(inProgress.id, 'skipped')
          // Volver a cargar sesiones para actualizar la lista
          const updatedSessions = await getPatientSessions(patientId, programCode)
          setSessions(updatedSessions)
          inProgress = undefined
        }
      }

      // 6. Asignar sesión actual si existe y es válida
      if (inProgress) {
        setCurrentSession(inProgress)
        const data = getProgramSessions(programCode).find(s => s.id === inProgress.session_number)
        setCurrentSessionData(data || null)
      } else {
        setCurrentSession(null)
        setCurrentSessionData(null)
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
      console.error('❌ Error en loadData:', err)
    } finally {
      setLoading(false)
    }
  }, [patientId, psychologistId, programCode, totalSessions])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ============================================================
  // INICIAR NUEVA SESIÓN
  // ============================================================
  const startNewSession = useCallback(async () => {
    if (!patientId || !psychologistId) {
      setError('Faltan datos del paciente o psicólogo')
      return
    }
    if (!isValidUUID(psychologistId)) {
      setError(`ID del psicólogo inválido: "${psychologistId}"`)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await getOrCreateSession(patientId, psychologistId, programCode)
      setCurrentSession(result.session)
      setCurrentSessionData(result.sessionData)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      console.error('❌ Error en startNewSession:', err)
    } finally {
      setLoading(false)
    }
  }, [patientId, psychologistId, programCode, loadData])

  // ============================================================
  // REGISTRAR LOGRO
  // ============================================================
  const submitAchievement = useCallback(
    async (data: {
      activityScores: Record<string, number>
      observations?: string
      nextSessionNotes?: string
    }) => {
      if (!currentSession) {
        setError('No hay sesión activa')
        return
      }
      if (!psychologistId || !isValidUUID(psychologistId)) {
        setError(`ID del psicólogo inválido: "${psychologistId}"`)
        return
      }
      if (!currentSession.id || !isValidUUID(currentSession.id)) {
        setError(`ID de sesión inválido: "${currentSession.id}"`)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const scores = Object.values(data.activityScores)
        const overallLevel = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 1

        await recordAchievement(
          currentSession.id,
          psychologistId,
          overallLevel,
          data.activityScores,
          data.observations || null,
          data.nextSessionNotes || null
        )
        await loadData()
      } catch (err: any) {
        setError(err.message || 'Error al registrar logro')
        console.error('❌ Error en submitAchievement:', err)
      } finally {
        setLoading(false)
      }
    },
    [currentSession, psychologistId, loadData]
  )

  // ============================================================
  // SALTAR SESIÓN
  // ============================================================
  const skipSession = useCallback(async () => {
    if (!currentSession) {
      setError('No hay sesión activa')
      return
    }
    if (!currentSession.id || !isValidUUID(currentSession.id)) {
      setError(`ID de sesión inválido: "${currentSession.id}"`)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updateSessionStatus(currentSession.id, 'skipped')
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Error al saltar sesión')
      console.error('❌ Error en skipSession:', err)
    } finally {
      setLoading(false)
    }
  }, [currentSession, loadData])

  // ============================================================
  // REFRESCAR
  // ============================================================
  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
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
    refresh,
  }
}