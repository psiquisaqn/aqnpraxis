// app/api/coopersmith/score/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { scoreCoopersmith, type CooperResponses } from '@/lib/coopersmith/engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const responses: CooperResponses = body.respuestas

    const resultado = scoreCoopersmith(responses)

    const { data, error } = await supabase
      .from('resultados')
      .insert({
        session_id: body.session_id,
        test: 'COOPERSMITH',
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