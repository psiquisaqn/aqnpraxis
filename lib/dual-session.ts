// lib/dual-session.ts
import { createBrowserClient } from '@supabase/ssr'

export async function getOrCreateDualSessionId(
  sessionId: string,
  testType: string = 'wisc5'
): Promise<string | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Buscar dual_session existente
  const { data: existing, error: findError } = await supabase
    .from('dual_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .eq('test_type', testType)
    .maybeSingle()

  if (findError) {
    console.error('❌ Error al buscar dual_session:', findError)
    return null
  }

  if (existing?.id) {
    return existing.id
  }

  // Crear nueva dual_session
  const { data: created, error: createError } = await supabase
    .from('dual_sessions')
    .insert({ session_id: sessionId, test_type: testType })
    .select('id')
    .single()

  if (createError) {
    console.error('❌ Error al crear dual_session:', createError)
    return null
  }

  return created?.id || null
}