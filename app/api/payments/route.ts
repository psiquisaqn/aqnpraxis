/**
 * AQN Praxis — Integración Transbank WebPay Plus
 * Maneja dos tipos de cobro:
 *   1. Suscripción mensual Plan Pro ($19.990 + IVA)
 *   2. Pago por informe individual ($2.990 + IVA)
 *
 * Documentación: https://www.transbankdevelopers.cl/documentacion/webpay-plus
 * SDK: transbank-sdk (npm)
 */

import { NextRequest, NextResponse }   from 'next/server'
import { createClient }                from '@supabase/supabase-js'
import { WebpayPlus, Options, IntegrationApiKeys, Environment } from 'transbank-sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

// Precios en pesos chilenos (sin IVA)
const PRICES = {
  pro_monthly:    19_990,  // Plan Pro mensual
  per_report:      2_990,  // Informe individual
} as const

const IVA = 0.19

function withIva(amount: number) {
  return Math.round(amount * (1 + IVA))
}

// Configurar WebPay según entorno
function getWebpay() {
  const isProduction = process.env.TRANSBANK_ENVIRONMENT === 'production'
  if (isProduction) {
    return new WebpayPlus.Transaction(
      new Options(
        process.env.TRANSBANK_COMMERCE_CODE!,
        process.env.TRANSBANK_API_KEY!,
        Environment.Production
      )
    )
  }
  // Integración (sandbox) — credenciales de prueba Transbank
  return new WebpayPlus.Transaction(
    new Options(
      IntegrationApiKeys.WEBPAY,
      IntegrationApiKeys.WEBPAY_APIKEY,
      Environment.Integration
    )
  )
}

// ─── POST /api/payments/initiate ─────────────────────────
// Inicia una transacción WebPay y devuelve la URL de redirección

export async function POST(req: NextRequest) {
  try {
    const { userId, planType, reportId } = await req.json() as {
      userId: string
      planType: 'pro_monthly' | 'per_report'
      reportId?: string  // solo para per_report
    }

    if (!userId || !planType) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verificar que el usuario existe
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const baseAmount = PRICES[planType]
    const totalAmount = withIva(baseAmount)
    const buyOrder = `AQN-${Date.now()}-${userId.slice(0, 8)}`
    const sessionId = `sess-${Date.now()}`
    const returnUrl = `${APP_URL}/api/payments/confirm?plan=${planType}${reportId ? `&reportId=${reportId}` : ''}`

    // Crear registro de transacción pendiente en Supabase
    await supabase.from('payments').insert({
      user_id:     userId,
      buy_order:   buyOrder,
      plan_type:   planType,
      report_id:   reportId ?? null,
      amount:      totalAmount,
      amount_net:  baseAmount,
      status:      'pending',
      created_at:  new Date().toISOString(),
    })

    // Iniciar transacción con Transbank
    const tx = getWebpay()
    const response = await tx.create(buyOrder, sessionId, totalAmount, returnUrl)

    return NextResponse.json({
      url:      response.url,         // URL del formulario WebPay
      token:    response.token,       // Token de la transacción
      buyOrder,
      amount:   totalAmount,
    })

  } catch (err) {
    console.error('[payments/initiate]', err)
    return NextResponse.json({ error: 'Error al iniciar pago' }, { status: 500 })
  }
}

// ─── GET /api/payments/confirm ────────────────────────────
// WebPay redirige aquí tras el pago. Confirma con Transbank y actualiza el plan.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token    = searchParams.get('token_ws')
  const planType = searchParams.get('plan') as 'pro_monthly' | 'per_report'
  const reportId = searchParams.get('reportId')

  // El usuario canceló en WebPay
  if (!token) {
    return NextResponse.redirect(`${APP_URL}/pricing?status=cancelled`)
  }

  try {
    const tx       = getWebpay()
    const response = await tx.commit(token)

    // Verificar que la transacción fue aprobada
    if (response.response_code !== 0 || response.status !== 'AUTHORIZED') {
      await supabase
        .from('payments')
        .update({ status: 'failed', transbank_response: response })
        .eq('buy_order', response.buy_order)

      return NextResponse.redirect(`${APP_URL}/pricing?status=failed`)
    }

    // Actualizar registro de pago
    const { data: payment } = await supabase
      .from('payments')
      .update({
        status:              'completed',
        transbank_token:     token,
        transbank_response:  response,
        authorization_code:  response.authorization_code,
        completed_at:        new Date().toISOString(),
      })
      .eq('buy_order', response.buy_order)
      .select('user_id')
      .single()

    if (!payment) throw new Error('Pago no encontrado')

    const userId = payment.user_id

    if (planType === 'pro_monthly') {
      // Activar Plan Pro por 30 días
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await supabase
        .from('profiles')
        .update({
          plan:             'pro',
          plan_expires_at:  expiresAt.toISOString(),
        })
        .eq('id', userId)

    } else if (planType === 'per_report' && reportId) {
      // Desbloquear informe específico
      await supabase
        .from('reports')
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq('id', reportId)
        .eq('psychologist_id', userId)
    }

    // Redirigir con éxito — volver al informe si corresponde
    const redirectTo = reportId
      ? `${APP_URL}/reports/${reportId}?payment=success`
      : `${APP_URL}/dashboard?payment=success`

    return NextResponse.redirect(redirectTo)

  } catch (err) {
    console.error('[payments/confirm]', err)
    return NextResponse.redirect(`${APP_URL}/pricing?status=error`)
  }
}
