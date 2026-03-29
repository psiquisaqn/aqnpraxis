// app/api/scores/peca/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { scorePeca, type PecaResponses } from '@/lib/peca/engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const responses: PecaResponses = body.respuestas  // ✅ un solo objeto

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