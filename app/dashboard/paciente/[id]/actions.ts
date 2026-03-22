'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Obtener ficha completa del paciente ─────────────────────────────
export async function getPatientFull(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [patientRes, sessionsRes, reportsRes, activityRes] = await Promise.all([
    supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('psychologist_id', user.id)
      .single(),

    supabase
      .from('sessions')
      .select('id, test_id, status, scheduled_at, started_at, completed_at, age_years, age_months, created_at')
      .eq('patient_id', patientId)
      .eq('psychologist_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('reports')
      .select('id, title, pdf_url, is_signed, created_at, version')
      .eq('patient_id', patientId)
      .eq('psychologist_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('activity_sessions')
      .select('id, program_code, session_number, status, scheduled_date, completed_date, created_at')
      .eq('patient_id', patientId)
      .eq('psychologist_id', user.id)
      .order('program_code')
      .order('session_number'),
  ])

  if (!patientRes.data) return null

  return {
    patient:    patientRes.data,
    sessions:   sessionsRes.data ?? [],
    reports:    reportsRes.data ?? [],
    activities: activityRes.data ?? [],
  }
}

// ── Actualizar datos del paciente ───────────────────────────────────
export async function updatePatient(patientId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('patients')
    .update({
      full_name:  formData.get('full_name')  as string,
      rut:        (formData.get('rut')  as string) || null,
      birth_date: formData.get('birth_date') as string,
      gender:     (formData.get('gender') as string) || null,
      school:     (formData.get('school') as string) || null,
      grade:      (formData.get('grade')  as string) || null,
      city:       (formData.get('city')   as string) || 'Chile',
      notes:      (formData.get('notes')  as string) || null,
    })
    .eq('id', patientId)
    .eq('psychologist_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/paciente/${patientId}`)
  return { success: true }
}

// ── Inscribir paciente en programa de intervención ──────────────────
export async function enrollProgram(patientId: string, programCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Obtener cuántas sesiones tiene el programa
  const SESSION_COUNTS: Record<string, number> = {
    PDPI:     59,
    'TP-CREM': 12,
    POSMAN:    1,
  }
  const total = SESSION_COUNTS[programCode] ?? 1

  // Verificar que no esté ya inscrito
  const { data: existing } = await supabase
    .from('activity_sessions')
    .select('id')
    .eq('patient_id', patientId)
    .eq('program_code', programCode)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'El paciente ya está inscrito en este programa' }
  }

  // Crear todas las sesiones del programa
  const rows = Array.from({ length: total }, (_, i) => ({
    patient_id:      patientId,
    psychologist_id: user.id,
    program_code:    programCode,
    session_number:  i,
    status:          'pending',
  }))

  const { error } = await supabase.from('activity_sessions').insert(rows)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/paciente/${patientId}`)
  return { success: true }
}

// ── Marcar sesión de actividad como completada ──────────────────────
export async function completeActivitySession(activitySessionId: string, patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('activity_sessions')
    .update({
      status:         'completed',
      completed_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', activitySessionId)
    .eq('psychologist_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/paciente/${patientId}`)
  return { success: true }
}
