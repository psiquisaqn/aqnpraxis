import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scoreCoopersmith, type CooperResponses } from '@/lib/coopersmith/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { sessionId, responses } = await req.json() as {
      sessionId: string
      responses: Record<number, 'igual' | 'diferente'>
    }
    if (!sessionId || !responses) {
      return NextResponse.json({ error: 'sessionId y responses requeridos' }, { status: 400 })
    }

    const result = scoreCoopersmith(responses as CooperResponses)

    // Columnas r01..r58
    const itemCols = Object.fromEntries(
      Object.entries(responses).map(([k, v]) => [`r${String(k).padStart(2, '0')}`, v])
    )

    const { error } = await supabase.from('coopersmith_scores').upsert({
      session_id:       sessionId,
      ...itemCols,
      total_raw:        result.totalRaw,
      total_scaled:     result.totalScaled,
      level:            result.level,
      level_label:      result.levelLabel,
      // Subescalas
      score_general:    result.subscales.find((s) => s.code === 'general')?.scaledScore,
      score_social:     result.subscales.find((s) => s.code === 'social')?.scaledScore,
      score_hogar:      result.subscales.find((s) => s.code === 'hogar')?.scaledScore,
      score_escolar:    result.subscales.find((s) => s.code === 'escolar')?.scaledScore,
      lie_scale_raw:    result.lieScaleRaw,
      lie_scale_invalid: result.lieScaleInvalid,
      is_complete:      result.isComplete,
      calculated_at:    new Date().toISOString(),
    }, { onConflict: 'session_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('sessions').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
