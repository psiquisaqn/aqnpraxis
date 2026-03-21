/**
 * POST /api/peca/score
 *
 * Recibe las respuestas del cuestionario PECA, calcula todos los
 * factores y subescalas, persiste en Supabase y notifica al psicólogo.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { scorePeca, validatePecaResponses } from '@/lib/peca/engine'

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, responses } = body as {
      sessionId: string
      responses: Record<number, number>
    }

    if (!sessionId || !responses) {
      return NextResponse.json({ error: 'sessionId y responses son requeridos' }, { status: 400 })
    }

    // Validar respuestas
    const validation = validatePecaResponses(responses)
    if (!validation) {
      return NextResponse.json({
        error: 'Respuestas inválidas',
        missing: [],
        invalid: [],
      }, { status: 400 })
    }

    // Calcular scoring
    const result = scorePeca(responses as any)

    // Persistir en Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from('peca_scores').upsert({
      session_id: sessionId,

      // Respuestas brutas
      ...Object.fromEntries(
        Object.entries(responses).map(([k, v]) => [`p${String(k).padStart(2,'0')}`, v])
      ),

      // Factores principales
      hcon: result.mainFactors.HCON.score,
      hsoc: result.mainFactors.HSOC.score,
      hpra: result.mainFactors.HPRA.score,
      hcon_level: result.mainFactors.HCON.level,
      hsoc_level: result.mainFactors.HSOC.level,
      hpra_level: result.mainFactors.HPRA.level,

      // Subescalas
      score_com: result.subfactors.com?.score,
      score_acu: result.subfactors.acu?.score,
      score_avd: result.subfactors.avd?.score,
      score_hs:  result.subfactors.hs?.score,
      score_haf: result.subfactors.haf?.score,
      score_uco: result.subfactors.uco?.score,
      score_adi: result.subfactors.adi?.score,
      score_css: result.subfactors.css?.score,
      score_aor: result.subfactors.aor?.score,

      // Niveles subescalas
      level_com: result.subfactors.com?.level,
      level_acu: result.subfactors.acu?.level,
      level_avd: result.subfactors.avd?.level,
      level_hs:  result.subfactors.hs?.level,
      level_haf: result.subfactors.haf?.level,
      level_uco: result.subfactors.uco?.level,
      level_adi: result.subfactors.adi?.level,
      level_css: result.subfactors.css?.level,
      level_aor: result.subfactors.aor?.level,

      // Participación global
      participation_level:       result.participationLevel,
      participation_level_label: result.participationLevelLabel,
      participation_description: result.participationDescription,

      completed_items: result.completedItems,
      calculated_at:   new Date().toISOString(),
    }, { onConflict: 'session_id' })

    if (error) {
      console.error('Error guardando PECA:', error)
      return NextResponse.json({ error: 'Error al guardar resultados' }, { status: 500 })
    }

    // Notificar al psicólogo via Realtime
    const { data: session } = await supabase
      .from('sessions')
      .select('realtime_channel')
      .eq('id', sessionId)
      .single()

    if (session?.realtime_channel) {
      await supabase
        .channel(session.realtime_channel)
        .send({
          type: 'broadcast',
          event: 'peca_completed',
          payload: result,
        })
    }

    // Actualizar estado de la sesión
    await supabase
      .from('sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    return NextResponse.json(result)

  } catch (err) {
    console.error('Error en /api/peca/score:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
