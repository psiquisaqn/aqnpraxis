// app/api/bdi2/score/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { scoreBdi2, type BdiResponses } from '@/lib/bdi2/engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const responses: BdiResponses = body.respuestas

    const resultado = scoreBdi2(responses)

    const { data, error } = await supabase
      .from('resultados')
      .insert({
        session_id: body.session_id,
        test: 'BDI2',
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