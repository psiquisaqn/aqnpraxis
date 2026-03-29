'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BDI2_ITEMS, scoreBdi2, type BdiResponse } from '@/lib/bdi2/engine'

interface Bdi2ControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: BdiResponse) => void
}

const RESPONSE_OPTIONS = [
  { value: 0, label: '0 - No me siento así' },
  { value: 1, label: '1 - A veces me siento así' },
  { value: 2, label: '2 - Me siento así frecuentemente' },
  { value: 3, label: '3 - Me siento así todo el tiempo' },
]

export function Bdi2Control({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse }: Bdi2ControlProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentItem, setCurrentItem] = useState(1)
  const [responses, setResponses] = useState<Record<number, BdiResponse>>({})
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [displayReady, setDisplayReady] = useState(false)

  const currentItemData = BDI2_ITEMS.find(item => item.num === currentItem)
  const allDone = completed === 21

  useEffect(() => {
    const handleDisplayReady = () => {
      setDisplayReady(true)
    }
    window.addEventListener('display_ready', handleDisplayReady)
    return () => window.removeEventListener('display_ready', handleDisplayReady)
  }, [])

  const sendCurrentItemToDisplay = () => {
    const itemData = BDI2_ITEMS.find(item => item.num === currentItem)
    if (itemData) {
      onUpdatePatient({
        type: 'bdi2',
        item: currentItem,
        label: itemData.label,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem],
        totalCompleted: completed,
        totalItems: 21
      })
    }
  }

  useEffect(() => {
    if (displayReady) {
      sendCurrentItemToDisplay()
    }
  }, [displayReady, currentItem, completed])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!displayReady) {
        sendCurrentItemToDisplay()
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleResponse = (value: BdiResponse) => {
    const newResponses = { ...responses, [currentItem]: value }
    setResponses(newResponses)
    setCompleted(Object.keys(newResponses).length)
    onSaveResponse(currentItem, value)

    onUpdatePatient({
      type: 'bdi2',
      item: currentItem,
      label: currentItemData?.label,
      options: RESPONSE_OPTIONS,
      selected: value,
      totalCompleted: Object.keys(newResponses).length,
      totalItems: 21
    })
  }

  const goToNext = () => {
    if (currentItem < 21) {
      setCurrentItem(currentItem + 1)
      const nextItem = BDI2_ITEMS.find(item => item.num === currentItem + 1)
      onUpdatePatient({
        type: 'bdi2',
        item: currentItem + 1,
        label: nextItem?.label,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem + 1],
        totalCompleted: completed,
        totalItems: 21
      })
    }
  }

  const goToPrev = () => {
    if (currentItem > 1) {
      setCurrentItem(currentItem - 1)
      const prevItem = BDI2_ITEMS.find(item => item.num === currentItem - 1)
      onUpdatePatient({
        type: 'bdi2',
        item: currentItem - 1,
        label: prevItem?.label,
        options: RESPONSE_OPTIONS,
        selected: responses[currentItem - 1],
        totalCompleted: completed,
        totalItems: 21
      })
    }
  }

  const goToItem = (num: number) => {
    setCurrentItem(num)
    const item = BDI2_ITEMS.find(i => i.num === num)
    onUpdatePatient({
      type: 'bdi2',
      item: num,
      label: item?.label,
      options: RESPONSE_OPTIONS,
      selected: responses[num],
      totalCompleted: completed,
      totalItems: 21
    })
  }

  const handleFinish = async () => {
    if (!allDone) return
    setFinishing(true)

    const result = scoreBdi2(responses)

    // Guardar respuestas con formato item_1, item_2, etc.
    const itemCols: Record<string, number> = {}
    for (let i = 1; i <= 21; i++) {
      if (responses[i] !== undefined) {
        itemCols[`item_${i}`] = responses[i]
      }
    }

    const { error: scoreError } = await supabase
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
      }, { onConflict: 'session_id' })

    if (scoreError) {
      alert('Error al guardar resultados: ' + scoreError.message)
      setFinishing(false)
      return
    }

    await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    await supabase
      .from('dual_session_tests')
      .upsert({
        dual_session_id: dualSessionId,
        test_id: 'bdi2',
        status: 'completed',
        result: result,
        completed_at: new Date().toISOString(),
        responses: responses
      }, { onConflict: 'dual_session_id' })

    router.push(`/resultados/bdi2?session=${sessionId}`)
  }

  const currentResponse = responses[currentItem]

  return (
    <div className="space-y-4">
      {/* ... resto del JSX sin cambios ... */}
    </div>
  )
}