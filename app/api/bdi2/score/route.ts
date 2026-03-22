import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scoreBdi2, type BdiResponses } from '@/lib/bdi2/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { sessionId, responses } = await req.json() as {
      sessionId: string
      responses: Record<number, number>
    }
    if (!sessionId || !responses) {
      return NextResponse.json({ error: 'sessionId y responses requeridos' }, { status: 400 })
    }

    const result = scoreBdi2(responses as BdiResponses)

    // Construir columnas i01..i21
    const itemCols = Object.fromEntries(
      Object.entries(responses).map(([k, v]) => [`i${String(k).padStart(2, '0')}`, v])
    )

    const { error } = await supabase.from('bdi2_scores').upsert({
      session_id: sessionId,
      ...itemCols,
      total_score:                   result.totalScore,
      severity:                      result.severity,
      severity_label:                result.severityLabel,
      cognitive_affective_score:     result.cognitiveAffectiveScore,
      somatic_motivational_score:    result.somaticMotivationalScore,
      suicidal_ideation_score:       result.suicidalIdeationScore,
      flagged_items:                 result.flaggedItems,
      is_complete:                   result.isComplete,
      calculated_at:                 new Date().toISOString(),
    }, { onConflict: 'session_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Marcar sesión como completada
    await supabase.from('sessions').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
