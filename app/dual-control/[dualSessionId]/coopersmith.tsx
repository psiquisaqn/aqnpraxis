'use client'
// app/dual-control/[dualSessionId]/coopersmith.tsx
// FIX #4: El bug del botón Finalizar que desaparece era porque "completed" es
// un state separado que puede desincronizarse de "responses" al navegar hacia
// atrás y corregir. Solución: eliminar el state "completed" y calcular
// directamente desde Object.keys(responses).length (valor derivado, no state).
// Así allDone = Object.keys(responses).length === 58 siempre es correcto.
//
// FIX #5 (Coopersmith): También se agrega patient_id y psychologist_id al
// insert de informes (eran necesarios y faltaban para que la tabla informes
// cargue correctamente en la página de Informes).
//
// FIX #6 (Coopersmith subescalas): Se agrega el mapeo de respuestas a
// columnas r01-r58 para que las subescalas se calculen correctamente.

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { COOPERSMITH_ITEMS } from '@/lib/coopersmith/engine'
import { DualTestWrapper } from './DualTestWrapper'

type CooperResponse = 'igual' | 'diferente'

interface CoopersmithControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}

function generarRecomendacionesCoopersmith(totalScaled: number, levelLabel: string): string {
  if (totalScaled >= 75) {
    return "El paciente presenta una autoestima alta y bien consolidada. Se recomienda mantener el ambiente de apoyo y refuerzo positivo actual."
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
  const [finishing, setFinishing] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const firstItemSent = useRef(false)

  const currentItemData = COOPERSMITH_ITEMS.find(item => item.num === currentItem)

  // FIX #4: calcular directamente del objeto, no de un state separado
  const completedCount = Object.keys(responses).length
  const allDone = completedCount === 58
  const answeredItems = new Set(Object.keys(responses).map(Number))

  const sendCurrentItemToDisplay = (resp = responses) => {
    const itemData = COOPERSMITH_ITEMS.find(item => item.num === currentItem)
    if (itemData) {
      onUpdatePatient({
        type: 'coopersmith',
        item: currentItem,
        text: itemData.text,
        options: ['Igual que yo', 'No es como yo'],
        selected: resp[currentItem],
        totalCompleted: Object.keys(resp).length,
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
  }, [displayReady, currentItem, showQuestionZero])

  const handleResponse = (value: CooperResponse) => {
    const newResponses = { ...responses, [currentItem]: value }
    setResponses(newResponses)
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
      totalCompleted: Object.keys(responses).length,
      totalItems: 58
    })
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)

    try {
      console.log('=== INICIANDO FINALIZACIÓN COOPERSMITH ===')
      console.log('Respuestas totales:', Object.keys(responses).length)
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { scoreCoopersmith } = await import('@/lib/coopersmith/engine')
      const result = scoreCoopersmith(responses)
      
      console.log('Resultado scoring:', { totalScaled: result.totalScaled, levelLabel: result.levelLabel })

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('patient_id')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Error obteniendo sesión:', sessionError)
        alert('Error al obtener información de la sesión')
        setFinishing(false)
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError)
        alert('Error de autenticación')
        setFinishing(false)
        return
      }

      const patientId = sessionData?.patient_id

      // FIX #6: Mapear respuestas a columnas r01-r58 para las subescalas
      const respuestasCols: Record<string, string> = {}
      for (let i = 1; i <= 58; i++) {
        const key = 'r' + String(i).padStart(2, '0')
        if (responses[i] !== undefined) {
          respuestasCols[key] = responses[i] === 'igual' ? 'igual' : 'diferente'
        }
      }
      
      console.log('Respuestas mapeadas a columnas:', Object.keys(respuestasCols).length)

      // Guardar en coopersmith_scores incluyendo respuestas individuales
      const { error: scoreError } = await supabase
        .from('coopersmith_scores')
        .upsert({
          session_id: sessionId,
          ...respuestasCols,
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

      // Guardar informe CON patient_id y psychologist_id
      const recomendaciones = generarRecomendacionesCoopersmith(result.totalScaled, result.levelLabel)

      const { data: existingInforme } = await supabase
        .from('informes')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (existingInforme) {
        await supabase
          .from('informes')
          .update({
            contenido: JSON.stringify({
              totalScaled: result.totalScaled,
              levelLabel: result.levelLabel,
              levelDescription: result.levelDescription,
              lieScaleRaw: result.lieScaleRaw,
              lieScaleInvalid: result.lieScaleInvalid,
              subscales: result.subscales
            }),
            puntaje_total: result.totalScaled,
            nivel: result.levelLabel,
            recomendaciones,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
        console.log('Informe actualizado correctamente')
      } else {
        const { error: informeError } = await supabase
          .from('informes')
          .insert({
            session_id: sessionId,
            patient_id: patientId,
            psychologist_id: user.id,
            test_id: 'coopersmith',
            titulo: 'Coopersmith SEI - Inventario de Autoestima',
            contenido: JSON.stringify({
              totalScaled: result.totalScaled,
              levelLabel: result.levelLabel,
              levelDescription: result.levelDescription,
              lieScaleRaw: result.lieScaleRaw,
              lieScaleInvalid: result.lieScaleInvalid,
              subscales: result.subscales
            }),
            puntaje_total: result.totalScaled,
            nivel: result.levelLabel,
            recomendaciones
          })

        if (informeError) {
          console.error('Error insertando informe:', informeError)
        } else {
          console.log('Informe Coopersmith guardado correctamente')
        }
      }

      // Actualizar sesión
      await supabase
        .from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

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
      completed={completedCount}
      onItemSelect={goToItem}
      items={coopersmithItemsList}
      answeredItems={answeredItems}
      showQuestionZero={showQuestionZero}
      onStart={handleStartTest}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progreso</span>
            <span className="text-gray-800 font-medium">{completedCount}/58 ítems</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completedCount / 58) * 100}%` }} />
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