'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { COOPERSMITH_ITEMS, type CooperResponse } from '@/lib/coopersmith/engine'
import { DualTestWrapper } from './DualTestWrapper'

interface CoopersmithControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: CooperResponse) => void
  displayReady?: boolean
}

function generarRecomendacionesCoopersmith(totalScaled: number, level: string): string {
  if (totalScaled >= 70) {
    return "Autoestima alta. Mantener estrategias de refuerzo positivo y desarrollo de habilidades sociales."
  } else if (totalScaled >= 50) {
    return "Autoestima media. Trabajar en áreas específicas para fortalecer la autoconfianza."
  } else if (totalScaled >= 30) {
    return "Autoestima baja. Se recomienda intervención psicoterapéutica focalizada en autoestima."
  } else {
    return "Autoestima muy baja. Requiere intervención intensiva y seguimiento psicológico."
  }
}

export function CoopersmithControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }: CoopersmithControlProps) {
  const router = useRouter()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<Record<number, CooperResponse>>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const firstItemSent = useRef(false)

  const currentItemData = COOPERSMITH_ITEMS.find(item => item.num === currentItem)
  const allDone = completed === 58

  const sendCurrentItemToDisplay = () => {
    const itemData = COOPERSMITH_ITEMS.find(item => item.num === currentItem)
    if (itemData) {
      onUpdatePatient({
        type: 'coopersmith',
        item: currentItem,
        text: itemData.text,
        options: ['Igual que yo', 'No es como yo'],
        selected: responses[currentItem],
        totalCompleted: completed,
        totalItems: 58
      })
    }
  }

  const handleStartTest = () => {
    setShowQuestionZero(false)
    setTimeout(() => {
      if (!firstItemSent.current) {
        sendCurrentItemToDisplay()
        firstItemSent.current = true
      }
    }, 500)
  }

  useEffect(() => {
    if (!showQuestionZero && !firstItemSent.current) {
      sendCurrentItemToDisplay()
      firstItemSent.current = true
    }
  }, [showQuestionZero])

  useEffect(() => {
    if (displayReady && !showQuestionZero) {
      sendCurrentItemToDisplay()
    }
  }, [displayReady, currentItem, completed, showQuestionZero])

  const handleResponse = (value: CooperResponse) => {
    const newResponses = { ...responses, [currentItem]: value }
    setResponses(newResponses)
    setCompleted(Object.keys(newResponses).length)
    onSaveResponse(currentItem, value)

    const itemData = COOPERSMITH_ITEMS.find(item => item.num === currentItem)
    onUpdatePatient({
      type: 'coopersmith',
      item: currentItem,
      text: itemData?.text,
      options: ['Igual que yo', 'No es como yo'],
      selected: value,
      totalCompleted: Object.keys(newResponses).length,
      totalItems: 58
    })
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    const item = COOPERSMITH_ITEMS.find(i => i.num === num)
    onUpdatePatient({
      type: 'coopersmith',
      item: num,
      text: item?.text,
      options: ['Igual que yo', 'No es como yo'],
      selected: responses[num],
      totalCompleted: completed,
      totalItems: 58
    })
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { scoreCoopersmith } = await import('@/lib/coopersmith/engine')
      const result = scoreCoopersmith(responses)

      console.log('=== RESULTADO COOPERSMITH ===')
      console.log('result:', result)

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('patient_id')
        .eq('id', sessionId)
        .single()

      console.log('sessionData:', sessionData)
      console.log('sessionError:', sessionError)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log('user:', user)
      console.log('userError:', userError)

      const patientId = sessionData?.patient_id

      console.log('=== DATOS PARA INFORME ===')
      console.log('sessionId:', sessionId)
      console.log('patientId:', patientId)
      console.log('psychologist_id:', user?.id)
      console.log('test_id:', 'coopersmith')
      console.log('puntaje_total:', result.totalScaled)
      console.log('nivel:', result.levelLabel)

      // Guardar en coopersmith_scores
      const { error: scoreError } = await supabase
        .from('coopersmith_scores')
        .upsert({
          session_id: sessionId,
          total_scaled: result.totalScaled,
          level_label: result.levelLabel,
          level_color: result.levelColor,
          level_description: result.levelDescription,
          lie_scale_raw: result.lieScaleRaw,
          lie_scale_invalid: result.lieScaleInvalid,
          calculated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })

      if (scoreError) {
        console.error('Error guardando coopersmith_scores:', scoreError)
        alert('Error al guardar: ' + scoreError.message)
        setFinishing(false)
        return
      }

      console.log('Coopersmith scores guardado correctamente')

      // Guardar informe
      const recomendaciones = generarRecomendacionesCoopersmith(result.totalScaled, result.levelLabel)
      
      const { data: existingInforme, error: checkError } = await supabase
        .from('informes')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle()

      console.log('Informe existente:', existingInforme)
      console.log('Error al buscar informe:', checkError)

      if (existingInforme) {
        const { data, error: updateError } = await supabase
          .from('informes')
          .update({
            contenido: JSON.stringify({
              totalScaled: result.totalScaled,
              levelLabel: result.levelLabel,
              levelDescription: result.levelDescription,
              lieScaleRaw: result.lieScaleRaw,
              lieScaleInvalid: result.lieScaleInvalid
            }),
            puntaje_total: result.totalScaled,
            nivel: result.levelLabel,
            recomendaciones: recomendaciones,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .select()
        
        console.log('Resultado UPDATE informe:', { data, error: updateError })
      } else {
        const { data, error: insertError } = await supabase
          .from('informes')
          .insert({
            session_id: sessionId,
            patient_id: patientId,
            psychologist_id: user?.id,
            test_id: 'coopersmith',
            titulo: `Coopersmith SEI - Inventario de Autoestima`,
            contenido: JSON.stringify({
              totalScaled: result.totalScaled,
              levelLabel: result.levelLabel,
              levelDescription: result.levelDescription,
              lieScaleRaw: result.lieScaleRaw,
              lieScaleInvalid: result.lieScaleInvalid
            }),
            puntaje_total: result.totalScaled,
            nivel: result.levelLabel,
            recomendaciones: recomendaciones
          })
          .select()
        
        console.log('Resultado INSERT informe:', { data, error: insertError })
      }

      await supabase
        .from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      console.log('Sesión actualizada a completed')
      console.log('Redirigiendo a resultados...')
      
      router.push(`/resultados/coopersmith?session=${sessionId}`)
    } catch(e: any) {
      console.error('Error inesperado:', e)
      alert('Error: ' + e.message)
      setFinishing(false)
    }
  }

  const coopersmithItemsList = COOPERSMITH_ITEMS.map(item => ({ num: item.num }))

  return (
    <DualTestWrapper
      title="Evaluación Coopersmith - Autoestima"
      totalItems={58}
      currentItem={currentItem}
      completed={completed}
      onItemSelect={goToItem}
      items={coopersmithItemsList}
      showQuestionZero={showQuestionZero}
      onStart={handleStartTest}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progreso</span>
            <span className="text-gray-800 font-medium">{completed}/58 ítems</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completed / 58) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">Ítem {currentItem}/58</span>
            {responses[currentItem] && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Respondido</span>}
          </div>
          <p className="text-gray-800 text-base leading-relaxed mb-4">
            {currentItemData?.text}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse('igual')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                responses[currentItem] === 'igual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✓ Igual que yo
            </button>
            <button
              onClick={() => handleResponse('diferente')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                responses[currentItem] === 'diferente'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✗ No es como yo
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => goToItem(Math.max(1, currentItem-1))} disabled={currentItem===1}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
            ← Anterior
          </button>
          <button onClick={() => goToItem(Math.min(58, currentItem+1))} disabled={currentItem===58}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
            Siguiente →
          </button>
        </div>

        {allDone && (
          <button onClick={handleFinish} disabled={finishing}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
            {finishing ? 'Finalizando...' : '✓ Finalizar evaluación'}
          </button>
        )}
      </div>
    </DualTestWrapper>
  )
}