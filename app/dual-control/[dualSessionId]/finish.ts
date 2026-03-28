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

  console.log('=== INICIANDO FINALIZACIÓN ===')
  console.log('dualSessionId:', dualSessionId)
  console.log('sessionId:', sessionId)
  console.log('responses count:', Object.keys(responses).length)

  // Calcular resultado
  const result = scoreCoopersmith(responses)
  console.log('Resultado calculado:', result)

  // Guardar resultado en dual_session_tests
  console.log('Guardando en dual_session_tests...')
  const { error: dualError } = await supabase
    .from('dual_session_tests')
    .upsert({
      dual_session_id: dualSessionId,
      test_id: 'coopersmith',
      status: 'completed',
      result: result,
      completed_at: new Date().toISOString(),
      responses: responses
    }, { onConflict: 'dual_session_id' })

  if (dualError) {
    console.error('Error saving dual session result:', dualError)
    alert('Error al guardar resultados: ' + dualError.message)
    return
  }
  console.log('Dual session test guardado')

  // Guardar resultado en coopersmith_scores
  console.log('Guardando en coopersmith_scores...')
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
    alert('Error al guardar puntajes: ' + scoreError.message)
    return
  }
  console.log('Coopersmith scores guardado')

  // Actualizar sesión como completada
  console.log('Actualizando sesión...')
  const { error: sessionError } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  if (sessionError) {
    console.error('Error updating session:', sessionError)
    alert('Error al actualizar sesión: ' + sessionError.message)
    return
  }
  console.log('Sesión actualizada')

  // Redirigir a resultados
  console.log('Redirigiendo a resultados...')
  router.push(`/resultados/coopersmith?session=${sessionId}`)
}