import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const psychologist_id = req.nextUrl.searchParams.get('psychologist_id')
  if (!psychologist_id) {
    return NextResponse.json({ error: 'psychologist_id requerido' }, { status: 400 })
  }

  const { data, error } = await db
    .from('patients')
    .select(`*, sessions(id, test_id, status, scheduled_at, completed_at, created_at)`)
    .eq('psychologist_id', psychologist_id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { psychologist_id, ...patientData } = body

    if (!psychologist_id) {
      return NextResponse.json({ error: 'psychologist_id requerido' }, { status: 400 })
    }

    const { data, error } = await db
      .from('patients')
      .insert({ psychologist_id, ...patientData })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
