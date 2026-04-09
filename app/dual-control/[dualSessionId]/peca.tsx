'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PECA_ITEMS, type PecaResponses } from '@/lib/peca/engine'
import { DualTestWrapper } from './DualTestWrapper'

interface PecaControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}

function generarRecomendacionesPECA(result: any): string {
  const nivel = result.participationLevel
  if (nivel >= 75) {
    return "El paciente presenta una alta capacidad de participación y adaptación conductual. Se recomienda continuar con estrategias de refuerzo positivo y monitoreo periódico."
  } else if (nivel >= 50) {
    return "El paciente muestra un nivel medio de participación. Se sugiere trabajar en áreas específicas identificadas en las dimensiones con menor puntuación, mediante actividades estructuradas y seguimiento cercano."
  } else if (nivel >= 25) {
    return "El paciente presenta dificultades significativas en conducta adaptativa. Se recomienda intervención multidisciplinaria, entrenamiento en habilidades específicas y reevaluación en 3-6 meses."
  } else {
    return "El paciente requiere apoyo intensivo en conducta adaptativa. Se recomienda derivación a especialistas, programa de intervención individualizado y reevaluación en 3 meses."
  }
}

export function PecaControl({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }: PecaControlProps) {
  const router = useRouter()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<PecaResponses>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const firstItemSent = useRef(false)

  const currentItemData = PECA_ITEMS.find(item => item.num === currentItem)
  const allDone = completed === 45

  const buildPayload = (num: number, sel?: number) => {
    const d = PECA_ITEMS.find(i => i.num === num)
    return {
      type: 'peca', item: num,
      leftPhrase: d?.leftPhrase,
      rightPhrase: d?.rightPhrase,
      options: [
        { value: 1, label: '1 - Muy parecido a la izquierda' },
        { value: 2, label: '2 - Algo parecido a la izquierda' },
        { value: 3, label: '3 - Algo parecido a la derecha' },
        { value: 4, label: '4 - Muy parecido a la derecha' },
      ],
      selected: sel,
      totalCompleted: completed,
      totalItems: 45
    }
  }

  const handleStartTest = () => {
    setShowQuestionZero(false)
    setTimeout(() => {
      if (!firstItemSent.current) {
        onUpdatePatient(buildPayload(1))
        firstItemSent.current = true
      }
    }, 500)
  }

  useEffect(() => {
    if (!showQuestionZero && !firstItemSent.current) {
      onUpdatePatient(buildPayload(1))
      firstItemSent.current = true
    }
  }, [showQuestionZero])

  useEffect(() => {
    if (displayReady && !showQuestionZero) {
      onUpdatePatient(buildPayload(currentItem, responses[currentItem] as number | undefined))
    }
  }, [displayReady, showQuestionZero])

  const handleResponse = (value: number) => {
    const newResponses = { ...responses, [currentItem]: value as 1|2|3|4 }
    setResponses(newResponses)
    const newCompleted = Object.keys(newResponses).length
    setCompleted(newCompleted)
    onSaveResponse(currentItem, value)
    onUpdatePatient({ ...buildPayload(currentItem, value), totalCompleted: newCompleted })
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    onUpdatePatient(buildPayload(num, responses[num] as number | undefined))
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { scorePeca } = await import('@/lib/peca/engine')
      const result = scorePeca(responses)

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

      // Mapear respuestas a columnas p01-p45
      const itemCols: Record<string, number> = {}
      for (let i = 1; i <= 45; i++) {
        const key = 'p' + String(i).padStart(2, '0')
        if (responses[i] !== undefined) itemCols[key] = responses[i] as number
      }

      const codeMap: Record<string, string> = {
        com: 'com', aut: 'acu', avi: 'avd', hs: 'hs',
        haf: 'haf', uco: 'uco', adi: 'adi', css: 'css', aor: 'aor'
      }
      
      const intensityMap: Record<string, string> = {
        'bueno': 'buen_nivel',
        'buen_nivel': 'buen_nivel',
        'limitado': 'limitado',
        'extenso': 'extenso',
        'generalizado': 'generalizado',
        'needs_support': 'limitado',
        'needs_support_acu': 'limitado'
      }
      
      const dimMap: Record<string, any> = {}
      result.dimensions.forEach((d: any) => {
        const col = codeMap[d.code] || d.code
        dimMap['score_' + col] = d.p2
        dimMap['level_' + col] = intensityMap[d.intensity] || 'buen_nivel'
      })

      const aamrCodeMap: Record<string, string> = { conceptual: 'con', social: 'soc', practical: 'pra' }
      const aamrMap: Record<string, any> = {}
      result.aamrSets.forEach((s: any) => {
        const col = aamrCodeMap[s.code] || s.code.slice(0,3)
        aamrMap['h' + col] = s.p2
        aamrMap['h' + col + '_level'] = s.needsSupport === true ? 'requiere_apoyo' : 'buen_nivel'
      })

      const hcon_level = aamrMap.hcon_level || 'buen_nivel'
      const hsoc_level = aamrMap.hsoc_level || 'buen_nivel'
      const hpra_level = aamrMap.hpra_level || 'buen_nivel'

      const { error: pecaError } = await supabase
        .from('peca_scores')
        .upsert({
          session_id: sessionId,
          ...itemCols,
          ...dimMap,
          ...aamrMap,
          hcon_level,
          hsoc_level,
          hpra_level,
          participation_level: result.participationLevel,
          completed_items: result.answeredItems,
          calculated_at: new Date().toISOString(),
        }, { onConflict: 'session_id' })
      
      if (pecaError) {
        console.error('Error guardando peca_scores:', pecaError)
        alert('Error al guardar resultados: ' + pecaError.message)
        setFinishing(false)
        return
      }

      // Guardar informe
      const recomendaciones = generarRecomendacionesPECA(result)
      const nivelTexto = result.participationLevel >= 75 ? 'Alto' : result.participationLevel >= 50 ? 'Medio' : result.participationLevel >= 25 ? 'Bajo' : 'Muy bajo'

      const { data: existingInforme } = await supabase
        .from('informes')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (existingInforme) {
        const { data, error: updateError } = await supabase
          .from('informes')
          .update({
            contenido: JSON.stringify({
              participationLevel: result.participationLevel,
              answeredItems: result.answeredItems,
              dimensions: result.dimensions,
              aamrSets: result.aamrSets
            }),
            puntaje_total: result.participationLevel,
            nivel: nivelTexto,
            recomendaciones: recomendaciones,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .select()

        if (updateError) {
          console.error('Error actualizando informe:', updateError)
        } else {
          console.log('Informe actualizado correctamente:', data)
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('informes')
          .insert({
            session_id: sessionId,
            patient_id: patientId,
            psychologist_id: user.id,
            test_id: 'peca',
            titulo: `PECA - Evaluación de Conducta Adaptativa`,
            contenido: JSON.stringify({
              participationLevel: result.participationLevel,
              answeredItems: result.answeredItems,
              dimensions: result.dimensions,
              aamrSets: result.aamrSets
            }),
            puntaje_total: result.participationLevel,
            nivel: nivelTexto,
            recomendaciones: recomendaciones
          })
          .select()

        if (insertError) {
          console.error('Error insertando informe:', insertError)
        } else {
          console.log('Informe insertado correctamente:', data)
        }
      }

      await supabase
        .from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      router.push('/dashboard')
    } catch(e: any) {
      console.error('Error inesperado:', e)
      alert('Error: ' + e.message)
      setFinishing(false)
    }
  }

  const pecaItemsList = PECA_ITEMS.map(item => ({ num: item.num }))

  return (
    <DualTestWrapper
      title="Evaluación PECA - Conducta Adaptativa"
      totalItems={45}
      currentItem={currentItem}
      completed={completed}
      onItemSelect={goToItem}
      items={pecaItemsList}
      showQuestionZero={showQuestionZero}
      onStart={handleStartTest}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progreso</span>
            <span className="text-gray-800 font-medium">{completed}/45 items</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: ((completed/45)*100) + "%" }} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">Item {currentItem}/45</span>
            {responses[currentItem] && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Respondido</span>}
          </div>
          <div className="flex justify-between gap-4 mb-4 text-sm">
            <span className="flex-1 text-left text-gray-700 font-medium">{currentItemData?.leftPhrase}</span>
            <span className="text-gray-400">vs</span>
            <span className="flex-1 text-right text-gray-700 font-medium">{currentItemData?.rightPhrase}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map((val) => (
              <button key={val} onClick={() => handleResponse(val)}
                className={`py-2 rounded-lg font-medium text-sm transition-all ${responses[currentItem] === val ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >{val}</button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>Izquierda</span><span>Derecha</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => goToItem(Math.max(1, currentItem-1))} disabled={currentItem===1}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
            Anterior
          </button>
          <button onClick={() => goToItem(Math.min(45, currentItem+1))} disabled={currentItem===45}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">
            Siguiente
          </button>
        </div>

        {allDone && (
          <button onClick={handleFinish} disabled={finishing}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
            {finishing ? 'Finalizando...' : 'Finalizar evaluacion PECA'}
          </button>
        )}
      </div>
    </DualTestWrapper>
  )
}