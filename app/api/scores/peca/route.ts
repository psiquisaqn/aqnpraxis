import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session')
    
    if (!sessionId) {
      return NextResponse.json({ error: 'session requerido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('peca_scores')
      .select('*, session:sessions(id, started_at, patient:patients(id, full_name))')
      .eq('session_id', sessionId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Resultados no encontrados' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en /api/scores/peca:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
