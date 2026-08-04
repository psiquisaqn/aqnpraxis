// app/api/scores/peca/route.ts
// FIX: Agregar método GET que devuelve peca_scores con join a sessions/patients.
// La página /resultados/peca llama GET /api/scores/peca?session=... y espera
// data.session.patient.full_name, data.session.started_at, y columnas p01-p45.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
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
}

// GET /api/scores/peca?session=<sessionId>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const session = searchParams.get('session')

  if (!session) {
    return NextResponse.json({ error: 'session requerida' }, { status: 400 })
  }

  const supabase = getSupabase()

  // 1. Obtener puntajes PECA (contiene p01-p45 y scores calculados)
  const { data: scores, error: scoresError } = await supabase
    .from('peca_scores')
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

  // 3. La página espera item_1...item_45 pero peca_scores guarda p01...p45
  // Crear alias para compatibilidad
  const itemAliases: Record<string, any> = {}
  for (let i = 1; i <= 45; i++) {
    const colKey = 'p' + String(i).padStart(2, '0')
    const aliasKey = 'item_' + i
    if ((scores as any)[colKey] !== undefined) {
      itemAliases[aliasKey] = (scores as any)[colKey]
    }
  }

  return NextResponse.json({
    ...scores,
    ...itemAliases,
    session: sessionData ?? null,
  })
}

// POST /api/scores/peca — mantener el comportamiento original
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabase()

    const { scorePeca, type: PecaResponses } = await import('@/lib/peca/engine') as any
    const responses = body.respuestas
    const resultado = scorePeca(responses)

    const { data, error } = await supabase
      .from('resultados')
      .insert({
        session_id: body.session_id,
        test: 'PECA',
        resultado,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
