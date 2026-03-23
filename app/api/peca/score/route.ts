import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scorePeca, validatePecaResponses } from '@/lib/peca/engine'

const db = createClient(
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
      return NextResponse.json({ error: 'sessionId y responses son requeridos' }, { status: 400 })
    }

    const validation = validatePecaResponses(responses)
    if (!validation.valid) {
      return NextResponse.json({ error: 'Respuestas incompletas', missing: validation.missing }, { status: 400 })
    }

    const result = scorePeca(responses as any)

    // Columnas p01..p45
    const itemCols = Object.fromEntries(
      Object.entries(responses).map(([k, v]) => [`p${String(k).padStart(2, '0')}`, v])
    )

    const dimMap = Object.fromEntries(result.dimensions.map(d => [d.code, d]))

    const { error } = await db.from('peca_scores').upsert({
      session_id: sessionId,
      ...itemCols,
      // Factores AAMR
      hcon: result.aamrSets.find(s => s.code === 'conceptual')?.p2 ?? null,
      hsoc: result.aamrSets.find(s => s.code === 'social')?.p2 ?? null,
      hpra: result.aamrSets.find(s => s.code === 'practical')?.p2 ?? null,
      hcon_level: (result.aamrSets.find(s => s.code === 'conceptual')?.needsSupport ? 'requiere_apoyo' : 'buen_nivel'),
      hsoc_level: (result.aamrSets.find(s => s.code === 'social')?.needsSupport ? 'requiere_apoyo' : 'buen_nivel'),
      hpra_level: (result.aamrSets.find(s => s.code === 'practical')?.needsSupport ? 'requiere_apoyo' : 'buen_nivel'),
      // Subescalas
      score_com: dimMap.com?.p2 ?? null,
      score_acu: dimMap.aut?.p2 ?? null,
      score_avd: dimMap.avi?.p2 ?? null,
      score_hs:  dimMap.hs?.p2 ?? null,
      score_haf: dimMap.haf?.p2 ?? null,
      score_uco: dimMap.uco?.p2 ?? null,
      score_adi: dimMap.adi?.p2 ?? null,
      score_css: dimMap.css?.p2 ?? null,
      score_aor: dimMap.aor?.p2 ?? null,
      // Nivel de participación
      participation_level: result.participationLevel,
      participation_level_label: result.participationNeeds ? 'requiere_apoyo' : 'buen_nivel',
      participation_description: result.participationText,
      completed_items: result.answeredItems,
      calculated_at: new Date().toISOString(),
    }, { onConflict: 'session_id' })

    if (error) {
      console.error('PECA score error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Marcar sesión como completada
    await db.from('sessions').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)

    return NextResponse.json({ success: true, sessionId })
  } catch (err: any) {
    console.error('Error en /api/peca/score:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
