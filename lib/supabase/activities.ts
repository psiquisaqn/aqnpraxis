// lib/supabase/activities.ts
import { createBrowserClient } from '@supabase/ssr'
import { supabase } from './client' // Asegúrate de tener tu cliente configurado
import { 
  PDPI_SESSIONS, 
  TPCREM_SESSIONS, 
  POSMAN_SESSION,
  type PdpiSession 
} from '@/lib/activities/all-sessions'

// ====================================================================
// TIPOS (coinciden con las tablas de Supabase)
// ====================================================================

export type ProgramCode = 'PDPI' | 'TP-CREM' | 'POSMAN'

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
  achievement_level: number // 1-6
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
  PDPI: PDPI_SESSIONS,      // 59 sesiones (0–58)
  'TP-CREM': TPCREM_SESSIONS, // 12 sesiones (1–12)
  POSMAN: [POSMAN_SESSION],   // 1 sesión
}

/**
 * Obtiene las sesiones de un programa (datos estáticos)
 */
export function getProgramSessions(programCode: ProgramCode): PdpiSession[] {
  return programSessionMap[programCode] || []
}

/**
 * Obtiene una sesión específica por su número
 */
export function getSessionByNumber(programCode: ProgramCode, sessionNumber: number): PdpiSession | undefined {
  const sessions = getProgramSessions(programCode)
  return sessions.find(s => s.id === sessionNumber)
}

/**
 * Obtiene el total de sesiones de un programa
 */
export function getTotalSessions(programCode: ProgramCode): number {
  return getProgramSessions(programCode).length
}

// ====================================================================
// FUNCIONES DE SUPABASE (cliente)
// ====================================================================

/**
 * Obtiene todas las sesiones de un paciente para un programa (desde la BD)
 */
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

/**
 * Obtiene el progreso de un paciente en un programa (usando la función SQL)
 */
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
 * Obtiene el número de la siguiente sesión para un paciente
 */
export async function getNextSessionNumber(
  patientId: string,
  programCode: ProgramCode
): Promise<number> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('get_next_session_number', {
    p_patient_id: patientId,
    p_program_code: programCode,
  })

  if (error) throw new Error(`Error al obtener siguiente sesión: ${error.message}`)
  return data ?? 0
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

  // 2. Obtener el siguiente número de sesión
  const nextNumber = await getNextSessionNumber(patientId, programCode)

  // 3. Verificar si el programa ya está completo
  const total = getTotalSessions(programCode)
  if (nextNumber >= total) {
    throw new Error('El programa ya ha sido completado.')
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

  const sessionData = getSessionByNumber(programCode, nextNumber)
  return { session: newSession, sessionData: sessionData || null }
}

/**
 * Registra un logro para una sesión y la marca como completada
 */
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

  // VALIDACIONES
  if (!activitySessionId || typeof activitySessionId !== 'string' || activitySessionId.trim() === '') {
    throw new Error('activitySessionId es requerido y debe ser un UUID válido')
  }
  if (!psychologistId || typeof psychologistId !== 'string' || psychologistId.trim() === '') {
    throw new Error('psychologistId es requerido y debe ser un UUID válido')
  }
  if (achievementLevel < 1 || achievementLevel > 6) {
    throw new Error('achievementLevel debe estar entre 1 y 6')
  }

  console.log('📝 Registrando logro:', {
    activitySessionId,
    psychologistId,
    achievementLevel,
    domainScores,
    observations,
    nextSessionNotes,
  })

  // 1. Insertar el registro de logro
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

  // 2. Actualizar el estado de la sesión a 'completed'
  const { error: updateError } = await supabase
    .from('activity_sessions')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', activitySessionId)

  if (updateError) {
    // Si falla la actualización, eliminamos el registro de logro (rollback manual)
    await supabase.from('achievement_records').delete().eq('id', record.id)
    console.error('❌ Error al actualizar sesión:', updateError)
    throw new Error(`Error al completar sesión: ${updateError.message}`)
  }

  return record
}

/**
 * Actualiza el estado de una sesión (útil para marcar como pending o skipped)
 */
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