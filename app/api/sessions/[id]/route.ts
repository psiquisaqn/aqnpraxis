import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@supabase/supabase-js'

const db = supabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await db
    .from('sessions')
    .select('id, realtime_channel, age_years, age_months, age_days, started_at, patient:patients(id, full_name, birth_date)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { error } = await db.from('sessions').update(body).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
