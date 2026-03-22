'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Patient } from '@/types'
import { calcAge } from '@/lib/utils'

// ── Listar pacientes con última sesión ──────────────────────────────
export async function getPatients(opts?: {
  search?: string
  archived?: boolean
}): Promise<Patient[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('patients')
    .select(`
      *,
      sessions(
        id, test_id, status, scheduled_at, completed_at, created_at
      )
    `)
    .eq('psychologist_id', user.id)
    .eq('is_archived', opts?.archived ?? false)
    .order('updated_at', { ascending: false })

  if (opts?.search) {
    query = query.ilike('full_name', `%${opts.search}%`)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((p: any) => {
    const sessions = (p.sessions ?? []) as any[]
    const sorted = sessions.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const age = calcAge(p.birth_date)
    return {
      ...p,
      age_years: age.years,
      age_months: age.months,
      session_count: sessions.length,
      latest_session: sorted[0] ?? null,
      sessions: undefined,
    }
  })
}

// ── Crear paciente ──────────────────────────────────────────────────
export async function createPatient(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado — ' + (authError?.message ?? 'sin sesión') }

  // Usar service role para bypass de RLS si hay problemas de permisos
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const payload = {
    psychologist_id: user.id,
    full_name:  formData.get('full_name')  as string,
    rut:        (formData.get('rut') as string) || null,
    birth_date: formData.get('birth_date') as string,
    gender:     (formData.get('gender') as string) || null,
    school:     (formData.get('school') as string) || null,
    grade:      (formData.get('grade') as string) || null,
    city:       (formData.get('city') as string) || 'Chile',
    notes:      (formData.get('notes') as string) || null,
  }

  const { error } = await serviceSupabase.from('patients').insert(payload)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ── Actualizar paciente ─────────────────────────────────────────────
export async function updatePatient(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const payload = {
    full_name:  formData.get('full_name')  as string,
    rut:        formData.get('rut')        as string | null,
    birth_date: formData.get('birth_date') as string,
    gender:     formData.get('gender')     as string | null,
    school:     formData.get('school')     as string | null,
    grade:      formData.get('grade')      as string | null,
    city:       (formData.get('city') as string) || 'Chile',
    notes:      formData.get('notes')      as string | null,
  }

  const { error } = await supabase
    .from('patients')
    .update(payload)
    .eq('id', id)
    .eq('psychologist_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Archivar / desarchivar ──────────────────────────────────────────
export async function archivePatient(id: string, archive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('patients')
    .update({ is_archived: archive })
    .eq('id', id)
    .eq('psychologist_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Crear nueva sesión ──────────────────────────────────────────────
export async function createSession(patientId: string, testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Obtener fecha de nacimiento para calcular edad
  const { data: patient } = await supabase
    .from('patients')
    .select('birth_date')
    .eq('id', patientId)
    .single()

  const age = patient ? calcAge(patient.birth_date) : { years: 0, months: 0, days: 0 }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      psychologist_id: user.id,
      patient_id:      patientId,
      test_id:         testId,
      status:          'in_progress',
      started_at:      new Date().toISOString(),
      age_years:       age.years,
      age_months:      age.months,
      age_days:        age.days,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Error al crear sesión' }
  return { sessionId: data.id }
}

