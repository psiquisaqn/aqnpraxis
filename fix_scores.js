const fs = require('fs')

// ============================================================
// FIX 1: Coopersmith API - tabla correcta y filtro por session
// ============================================================
const coopersmithRoute = `import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const session = searchParams.get('session')

  if (!session) {
    return NextResponse.json({ error: 'session requerida' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('coopersmith_scores')
    .select('*')
    .eq('session_id', session)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
`
fs.writeFileSync('app/api/scores/coopersmith/route.ts', coopersmithRoute, 'utf8')
console.log('coopersmith route OK')

// ============================================================
// FIX 2: PECA - mapear codigos del engine a columnas reales
// Columnas: score_com, score_acu, score_avd, score_hs, score_haf, score_uco, score_adi, score_css, score_aor
// Engine codes: com, aut, avi, hs, haf, uco, adi, css, aor
// Mapeo: aut->acu, avi->avd (los demas son iguales)
// ============================================================
let peca = fs.readFileSync('app/dual-control/[dualSessionId]/peca.tsx', 'utf8')

peca = peca.replace(
  `      // Mapear dimensiones
      const dimMap: Record<string, any> = {}
      result.dimensions.forEach((d: any) => {
        dimMap['score_' + d.code] = d.p2
        dimMap['level_' + d.code] = d.intensity
      })`,
  `      // Mapear dimensiones (engine code -> columna DB)
      const codeMap: Record<string, string> = {
        com: 'com', aut: 'acu', avi: 'avd', hs: 'hs',
        haf: 'haf', uco: 'uco', adi: 'adi', css: 'css', aor: 'aor'
      }
      const dimMap: Record<string, any> = {}
      result.dimensions.forEach((d: any) => {
        const col = codeMap[d.code] || d.code
        dimMap['score_' + col] = d.p2
        dimMap['level_' + col] = d.intensity
      })`
)

// Mapear AAMR sets: conceptual->con, social->soc, practical->pra
peca = peca.replace(
  `      // Mapear AAMR sets
      const aamrMap: Record<string, any> = {}
      result.aamrSets.forEach((s: any) => {
        aamrMap['h' + s.code.slice(0,3)] = s.p2
        aamrMap['h' + s.code.slice(0,3) + '_level'] = s.needsSupport ? 'needs_support' : 'ok'
      })`,
  `      // Mapear AAMR sets
      const aamrCodeMap: Record<string, string> = { conceptual: 'con', social: 'soc', practical: 'pra' }
      const aamrMap: Record<string, any> = {}
      result.aamrSets.forEach((s: any) => {
        const col = aamrCodeMap[s.code] || s.code.slice(0,3)
        aamrMap['h' + col] = s.p2
        aamrMap['h' + col + '_level'] = s.needsSupport ? 'needs_support' : 'ok'
      })`
)

fs.writeFileSync('app/dual-control/[dualSessionId]/peca.tsx', peca, 'utf8')
console.log('peca mapping OK')

// ============================================================
// FIX 3: BDI-2 - mapear a columnas reales de bdi2_scores
// Columnas: total_score, severity, severity_label, cognitive_affective_score,
//           somatic_motivational_score, suicidal_ideation_score, is_complete, item_1..item_21
// ============================================================
let bdi2 = fs.readFileSync('app/dual-control/[dualSessionId]/bdi2.tsx', 'utf8')

bdi2 = bdi2.replace(
  `      const result = scoreBdi2(responses)
      const itemCols: Record<string, number> = {}
      for (let i = 1; i <= 21; i++) {
        if (responses[i] !== undefined) itemCols['item_' + String(i).padStart(2, '0')] = responses[i] as any
      }
      const { error } = await supabase
        .from('bdi2_scores')
        .upsert({ session_id: sessionId, ...itemCols, ...result }, { onConflict: 'session_id' })`,
  `      const result = scoreBdi2(responses)
      const itemCols: Record<string, number> = {}
      for (let i = 1; i <= 21; i++) {
        if (responses[i] !== undefined) itemCols['item_' + i] = responses[i] as number
      }
      const { error } = await supabase
        .from('bdi2_scores')
        .upsert({
          session_id: sessionId,
          ...itemCols,
          total_score: result.totalScore,
          severity: result.severity,
          severity_label: result.severityLabel,
          cognitive_affective_score: result.cognitiveAffectiveScore,
          somatic_motivational_score: result.somaticMotivationalScore,
          suicidal_ideation_score: result.suicidalIdeationScore,
          is_complete: true,
          calculated_at: new Date().toISOString(),
        }, { onConflict: 'session_id' })`
)

fs.writeFileSync('app/dual-control/[dualSessionId]/bdi2.tsx', bdi2, 'utf8')
console.log('bdi2 mapping OK')
