import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { WebpayPlus, Options, Environment } from 'transbank-sdk'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Crear transacción con WebpayPlus usando llaves de integración
    const tx = new WebpayPlus.Transaction(
      new Options(
        process.env.COMMERCE_CODE || '597055555532', // código de comercio de integración
        process.env.API_KEY || 'test_api_key',       // llave de integración
        Environment.Integration                      // ambiente de integración
      )
    )

    const response = await tx.create(
      body.buyOrder,
      body.sessionId,
      body.amount,
      body.returnUrl
    )

    // Guardar en Supabase
    const { data, error } = await supabase
      .from('payments')
      .insert({
        session_id: body.sessionId,
        amount: body.amount,
        buy_order: body.buyOrder,
        token: response.token,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, response }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}