// lib/supabase/activities.ts
import { createBrowserClient } from '@supabase/ssr'
import { supabase } from './client'
import {
  PDPI_SESSIONS,
  TPCREM_SESSIONS,
  type PdpiSession
} from '@/lib/activities'

// ====================================================================
// TIPOS (POSMAN eliminado)
// ====================================================================

export type ProgramCode = 'PDPI' | 'TP-CREM'

export interface ActivitySessionDB {
  id: string
  patient_id: string
  psychologist_id: string
  program_code: ProgramCode
  session_number: number
  scheduled_date: string | null
  completed_date: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  created_at: string
}

export interface AchievementRecordDB {
  id: string
  activity_session_id: string
  psychologist_id: string
  achievement_level: number
  domain_scores: Record<string, number> | null
  observations: string | null
  next_session_notes: string | null
  recorded_at: string
}

export interface ProgramProgress {
  sessions_completed: number
  last_session: number
  avg_achievement: number | null
  min_achievement: number | null
  max_achievement: number | null
}

// ====================================================================
// MAPEO DE PROGRAMAS A SESIONES ESTÁTICAS
// ====================================================================

const programSessionMap: Record<ProgramCode, PdpiSession[]> = {
  PDPI: PDPI_SESSIONS,
  'TP-CREM': TPCREM_SESSIONS,
}

export function getProgramSessions(programCode: ProgramCode): PdpiSession[] {
  return programSessionMap[programCode] || []
}

export function getSessionByNumber(programCode: ProgramCode, sessionNumber: number): PdpiSession | undefined {
  const sessions = getProgramSessions(programCode)
  return sessions.find(s => s.id === sessionNumber)
}

export function getTotalSessions(programCode: ProgramCode): number {
  return getProgramSessions(programCode).length
}

// ====================================================================
// FUNCIONES DE SUPABASE (cliente)
// ====================================================================

export async function getPatientSessions(
  patientId: string,
  programCode: ProgramCode
): Promise<ActivitySessionDB[]> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('activity_sessions')
    .select('*')
    .eq('patient_id', patientId)
    .eq('program_code', programCode)
    .order('session_number', { ascending: true })

  if (error) throw new Error(`Error al obtener sesiones: ${error.message}`)
  return data || []
}

export async function getProgramProgress(
  patientId: string,
  programCode: ProgramCode
): Promise<ProgramProgress | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('get_program_progress', {
    p_patient_id: patientId,
    p_program_code: programCode,
  })

  if (error) throw new Error(`Error al obtener progreso: ${error.message}`)
  return data?.[0] || null
}

/**
 * Obtiene el siguiente número de sesión disponible para un paciente y programa.
 * Considera todos los números de sesión ya utilizados (cualquier estado) y
 * los números de sesión disponibles en el programa estático.
 */
export async function getNextAvailableSessionNumber(
  patientId: string,
  programCode: ProgramCode
): Promise<number> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Obtener todos los números de sesión ya utilizados para este paciente y programa
  const { data: existingSessions, error } = await supabase
    .from('activity_sessions')
    .select('session_number')
    .eq('patient_id', patientId)
    .eq('program_code', programCode)

  if (error) throw new Error(`Error al obtener sesiones existentes: ${error.message}`)

  const usedNumbers = new Set(existingSessions.map(s => s.session_number))

  // 2. Obtener los números de sesión disponibles en el programa estático
  const staticSessions = getProgramSessions(programCode)
  const availableNumbers = staticSessions.map(s => s.id).sort((a, b) => a - b)

  // 3. Encontrar el primer número disponible que no esté en usedNumbers
  for (const num of availableNumbers) {
    if (!usedNumbers.has(num)) {
      return num
    }
  }

  // 4. Si no hay ninguno, el programa está completo
  throw new Error('El programa ya ha sido completado.')
}

/**
 * Crea una nueva sesión en la BD para un paciente
 * (o la recupera si ya existe una 'in_progress')
 */
export async function getOrCreateSession(
  patientId: string,
  psychologistId: string,
  programCode: ProgramCode
): Promise<{ session: ActivitySessionDB; sessionData: PdpiSession | null }> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Verificar si hay una sesión en progreso
  const { data: existing, error: checkError } = await supabase
    .from('activity_sessions')
    .select('*')
    .eq('patient_id', patientId)
    .eq('program_code', programCode)
    .eq('status', 'in_progress')
    .maybeSingle()

  if (checkError) throw new Error(`Error al verificar sesión: ${checkError.message}`)

  if (existing) {
    const sessionData = getSessionByNumber(programCode, existing.session_number)
    return { session: existing, sessionData: sessionData || null }
  }

  // 2. Obtener el siguiente número de sesión disponible
  const nextNumber = await getNextAvailableSessionNumber(patientId, programCode)

  // 3. Obtener los datos estáticos de la sesión
  const sessionData = getSessionByNumber(programCode, nextNumber)
  if (!sessionData) {
    throw new Error(`No existe una sesión con el número ${nextNumber} en el programa ${programCode}`)
  }

  // 4. Crear la nueva sesión
  const { data: newSession, error: insertError } = await supabase
    .from('activity_sessions')
    .insert({
      patient_id: patientId,
      psychologist_id: psychologistId,
      program_code: programCode,
      session_number: nextNumber,
      status: 'in_progress',
      scheduled_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (insertError) throw new Error(`Error al crear sesión: ${insertError.message}`)

  return { session: newSession, sessionData }
}

export async function recordAchievement(
  activitySessionId: string,
  psychologistId: string,
  achievementLevel: number,
  domainScores: Record<string, number> | null = null,
  observations: string | null = null,
  nextSessionNotes: string | null = null
): Promise<AchievementRecordDB> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!activitySessionId || typeof activitySessionId !== 'string' || activitySessionId.trim() === '') {
    throw new Error('activitySessionId es requerido y debe ser un UUID válido')
  }
  if (!psychologistId || typeof psychologistId !== 'string' || psychologistId.trim() === '') {
    throw new Error('psychologistId es requerido y debe ser un UUID válido')
  }
  if (achievementLevel < 1 || achievementLevel > 6) {
    throw new Error('achievementLevel debe estar entre 1 y 6')
  }

  const { data: record, error: insertError } = await supabase
    .from('achievement_records')
    .insert({
      activity_session_id: activitySessionId,
      psychologist_id: psychologistId,
      achievement_level: achievementLevel,
      domain_scores: domainScores,
      observations: observations,
      next_session_notes: nextSessionNotes,
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error al insertar achievement_records:', insertError)
    throw new Error(`Error al registrar logro: ${insertError.message}`)
  }

  const { error: updateError } = await supabase
    .from('activity_sessions')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', activitySessionId)

  if (updateError) {
    await supabase.from('achievement_records').delete().eq('id', record.id)
    console.error('❌ Error al actualizar sesión:', updateError)
    throw new Error(`Error al completar sesión: ${updateError.message}`)
  }

  return record
}

export async function updateSessionStatus(
  sessionId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
): Promise<void> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('activity_sessions')
    .update({ status })
    .eq('id', sessionId)

  if (error) throw new Error(`Error al actualizar sesión: ${error.message}`)
}