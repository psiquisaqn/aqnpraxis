// app/api/scores/coopersmith/route.ts
// FIX: La API anterior solo devolvía coopersmith_scores.* sin datos de sesión
// ni paciente. La página de resultados necesita session.patient.full_name,
// session.patient.id, y session.started_at para mostrar el informe completo.
// También se incluye el total_scaled y level_label guardados para no tener
// que recalcular desde las respuestas individuales.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const session = searchParams.get('session')

  if (!session) {
    return NextResponse.json({ error: 'session requerida' }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Obtener puntajes Coopersmith
  const { data: scores, error: scoresError } = await supabase
    .from('coopersmith_scores')
    .select('*')
    .eq('session_id', session)
    .single()

  if (scoresError || !scores) {
    return NextResponse.json({ error: scoresError?.message ?? 'No encontrado' }, { status: 404 })
  }

  // 2. Obtener datos de sesión + paciente
  const { data: sessionData } = await supabase
    .from('sessions')
    .select(`
      id,
      started_at,
      completed_at,
      patient:patients(id, full_name, rut, birth_date, gender, school, grade)
    `)
    .eq('id', session)
    .single()

  // 3. Combinar todo en un objeto que la página de resultados espera
  return NextResponse.json({
    ...scores,
    session: sessionData ?? null,
  })
}
