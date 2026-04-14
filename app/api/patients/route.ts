// app/api/patients/route.ts
// FIX #7: La API devolvía TODOS los pacientes sin filtrar por usuario.
// Ahora obtiene el usuario autenticado desde las cookies y filtra por
// psychologist_id. Si no hay sesión activa, devuelve 401.

import { NextResponse, NextRequest } from 'next/server'
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
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch {}
          })
        },
      },
    }
  )
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  // Acepta psychologist_id como parámetro (compatibilidad con PatientList)
  // pero siempre usa el usuario autenticado para garantizar seguridad
  const psychologistId = user.id

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      sessions(id, test_id, status, created_at, completed_at)
    `)
    .eq('psychologist_id', psychologistId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    // Forzar psychologist_id al usuario autenticado
    const payload = { ...body, psychologist_id: user.id }

    const { data, error } = await supabase
      .from('patients')
      .insert(payload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data, sessionId: data.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
