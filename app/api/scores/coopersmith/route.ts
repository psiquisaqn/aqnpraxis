import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const session = searchParams.get('session')

  if (!session) {
    return NextResponse.json({ error: 'session requerida' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('coopersmith_scores')
    .select('*')
    .eq('session_id', session)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
