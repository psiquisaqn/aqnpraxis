// @ts-nocheck
/**
 * POST /api/wisc5/score
 *
 * Recibe puntajes brutos (parciales o completos) de una sesión WISC-V,
 * calcula puntajes escala, índices y pronóstico en tiempo real,
 * persiste en Supabase y emite evento via Realtime.
 *
 * Body: { sessionId, rawScores: RawScores, subtestJustEntered?: SubtestCode }
 * Returns: WiscScoringResult
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { createWisc5Engine, type RawScores, type SubtestCode } from '@/lib/wisc5/engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, rawScores, substitution } = body as {
      sessionId: string
      rawScores: RawScores
      substitution?: SubtestCode
    }

    if (!sessionId || !rawScores) {
      return NextResponse.json({ error: 'sessionId y rawScores son requeridos' }, { status: 400 })
    }

    // Cliente con service role para escritura
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener la sesión con datos del paciente
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, patient:patients(birth_date)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Calcular edad y puntajes
    const engine   = createWisc5Engine(supabaseUrl, supabaseServiceKey)
    const birthDate = new Date(session.patient.birth_date)
    const evalDate  = session.started_at ? new Date(session.started_at) : new Date()

    const result = await engine.score(birthDate, evalDate, rawScores, { substitution })

    // Persistir en wisc5_scores (upsert)
    const { error: upsertError } = await supabase
      .from('wisc5_scores')
      .upsert({
        session_id: sessionId,
        // Puntajes brutos
        ...Object.fromEntries(
          Object.entries(rawScores).map(([k, v]) => [`${k.toLowerCase()}_raw`, v])
        ),
        // Puntajes escala
        ...Object.fromEntries(
          Object.entries(result.scaledScores).map(([k, v]) => [`${k.toLowerCase()}_scaled`, v])
        ),
        // Índices
        icv: result.ICV?.score, icv_percentile: result.ICV?.percentile,
        icv_ci90_lo: result.ICV?.ci90[0], icv_ci90_hi: result.ICV?.ci90[1],
        ive: result.IVE?.score, ive_percentile: result.IVE?.percentile,
        ive_ci90_lo: result.IVE?.ci90[0], ive_ci90_hi: result.IVE?.ci90[1],
        irf: result.IRF?.score, irf_percentile: result.IRF?.percentile,
        irf_ci90_lo: result.IRF?.ci90[0], irf_ci90_hi: result.IRF?.ci90[1],
        imt: result.IMT?.score, imt_percentile: result.IMT?.percentile,
        imt_ci90_lo: result.IMT?.ci90[0], imt_ci90_hi: result.IMT?.ci90[1],
        ivp: result.IVP?.score, ivp_percentile: result.IVP?.percentile,
        ivp_ci90_lo: result.IVP?.ci90[0], ivp_ci90_hi: result.IVP?.ci90[1],
        cit: result.CIT?.score, cit_percentile: result.CIT?.percentile,
        cit_ci90_lo: result.CIT?.ci90[0], cit_ci90_hi: result.CIT?.ci90[1],
        // Sumas
        sum_icv: result.ICV?.sumScaled, sum_ive: result.IVE?.sumScaled,
        sum_irf: result.IRF?.sumScaled, sum_imt: result.IMT?.sumScaled,
        sum_ivp: result.IVP?.sumScaled, sum_cit: result.CIT?.sumScaled,
        // Clasificación
        classification: result.CIT?.classification ?? result.realtimePrediction?.estimatedClassification,
        // Pronóstico
        realtime_prediction: result.realtimePrediction,
        substitutions: substitution ? [substitution] : [],
        calculated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' })

    if (upsertError) {
      console.error('Error guardando puntajes:', upsertError)
      return NextResponse.json({ error: 'Error al guardar puntajes' }, { status: 500 })
    }

    // Broadcast via Supabase Realtime al canal de la sesión
    // (el frontend se suscribe con session.realtime_channel)
    await supabase
      .channel(session.realtime_channel)
      .send({
        type: 'broadcast',
        event: 'score_update',
        payload: result,
      })

    return NextResponse.json(result)

  } catch (err) {
    console.error('Error en /api/wisc5/score:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
