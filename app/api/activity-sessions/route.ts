import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SESSION_COUNTS: Record<string, number> = { PDPI: 59, 'TP-CREM': 12, POSMAN: 1 }

// POST — inscribir en programa
export async function POST(req: NextRequest) {
  const { patient_id, psychologist_id, program_code } = await req.json()

  const { data: existing } = await db.from('activity_sessions')
    .select('id').eq('patient_id', patient_id).eq('program_code', program_code).limit(1)

  if (existing && existing.length > 0)
    return NextResponse.json({ error: 'El paciente ya está inscrito en este programa' }, { status: 400 })

  const total = SESSION_COUNTS[program_code] ?? 1
  const rows = Array.from({ length: total }, (_, i) => ({
    patient_id, psychologist_id, program_code, session_number: i, status: 'pending',
  }))

  const { error } = await db.from('activity_sessions').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH — marcar sesión como completada
export async function PATCH(req: NextRequest) {
  const { id, psychologist_id } = await req.json()
  const { error } = await db.from('activity_sessions')
    .update({ status: 'completed', completed_date: new Date().toISOString().split('T')[0] })
    .eq('id', id).eq('psychologist_id', psychologist_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
