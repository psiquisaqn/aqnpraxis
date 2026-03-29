import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@supabase/supabase-js'

const db = supabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session')
  if (!sessionId) return NextResponse.json({ error: 'session requerido' }, { status: 400 })

  const { data, error } = await db
    .from('bdi2_scores')
    .select('*, session:sessions(started_at, patient:patients(id, full_name))')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(data)
}
