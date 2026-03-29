/**
 * GET /api/wisc5/session?sessionId=xxx
 * Devuelve la sesión completa con puntajes WISC-V calculados.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@supabase/supabase-js'

const supabase = supabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 })
  }

  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .select(`
      id, status, started_at, completed_at,
      age_years, age_months, age_days, age_group,
      patient:patients(id, full_name, rut, birth_date, gender, school, grade, city),
      wisc5_scores(*)
    `)
    .eq('id', sessionId)
    .single()

  if (sErr || !session) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  }

  return NextResponse.json(session)
}
