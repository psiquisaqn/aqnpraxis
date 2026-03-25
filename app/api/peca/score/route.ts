import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scorePeca, type PecaResponses } from '@/lib/peca/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { sessionId, responses } = await req.json() as {
      sessionId: string
      responses: Record<number, 1 | 2 | 3 | 4>
    }
    
    if (!sessionId || !responses) {
      return NextResponse.json({ error: 'sessionId y responses requeridos' }, { status: 400 })
    }

    const result = scorePeca(responses as PecaResponses)

    // Guardar respuestas en columnas item_1 a item_45
    const itemCols: Record<string, number> = {}
    for (let i = 1; i <= 45; i++) {
      if (responses[i] !== undefined) {
        itemCols[`item_${i}`] = responses[i]
      }
    }

    // Guardar resultados de dimensiones como JSON (opcional, para consultas rápidas)
    const dimensionsSummary = result.dimensions.map(d => ({
      code: d.code,
      label: d.label,
      p2: d.p2,
      intensity: d.intensity,
      intensityLabel: d.intensityLabel
    }))

    const aamrSummary = result.aamrSets.map(s => ({
      code: s.code,
      label: s.label,
      p2: s.p2,
      needsSupport: s.needsSupport
    }))

    const { error } = await supabase
      .from('peca_scores')
      .upsert({
        session_id: sessionId,
        ...itemCols,
        answered_items: result.answeredItems,
        is_complete: result.isComplete,
        participation_level: result.participationLevel,
        participation_needs: result.participationNeeds,
        dimensions_summary: dimensionsSummary,
        aamr_summary: aamrSummary,
        calculated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' })

    if (error) {
      console.error('Error guardando en peca_scores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en /api/peca/score:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
