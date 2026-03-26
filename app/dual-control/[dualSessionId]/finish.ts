import { createClient } from '@/lib/supabase/client'
import { scoreCoopersmith } from '@/lib/coopersmith/engine'

interface FinishEvaluationProps {
  dualSessionId: string
  sessionId: string
  responses: Record<number, 'igual' | 'diferente'>
  router: any
}

export async function finishEvaluation({ dualSessionId, sessionId, responses, router }: FinishEvaluationProps) {
  const supabase = createClient()

  // Calcular resultado
  const result = scoreCoopersmith(responses)

  // Guardar resultado en dual_session_tests
  const { error: dualError } = await supabase
    .from('dual_session_tests')
    .update({
      status: 'completed',
      result: result,
      completed_at: new Date().toISOString(),
      responses: responses
    })
    .eq('dual_session_id', dualSessionId)

  if (dualError) {
    console.error('Error saving dual session result:', dualError)
    return
  }

  // Guardar resultado en coopersmith_scores
  const itemCols: Record<string, string> = {}
  for (let i = 1; i <= 58; i++) {
    if (responses[i]) {
      itemCols[`r${String(i).padStart(2, '0')}`] = responses[i]
    }
  }

  const { error: scoreError } = await supabase
    .from('coopersmith_scores')
    .upsert({
      session_id: sessionId,
      ...itemCols,
      total_raw: result.totalRaw,
      total_scaled: result.totalScaled,
      level: result.level,
      level_label: result.levelLabel,
      score_general: result.subscales.find(s => s.code === 'general')?.scaledScore,
      score_social: result.subscales.find(s => s.code === 'social')?.scaledScore,
      score_hogar: result.subscales.find(s => s.code === 'hogar')?.scaledScore,
      score_escolar: result.subscales.find(s => s.code === 'escolar')?.scaledScore,
      lie_scale_raw: result.lieScaleRaw,
      lie_scale_invalid: result.lieScaleInvalid,
      is_complete: true,
      calculated_at: new Date().toISOString(),
    }, { onConflict: 'session_id' })

  if (scoreError) {
    console.error('Error saving coopersmith scores:', scoreError)
    return
  }

  // Actualizar sesión como completada
  await supabase
    .from('sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  // Redirigir a resultados
  router.push(`/resultados/coopersmith?session=${sessionId}`)
}