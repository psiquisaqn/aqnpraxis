'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { TestLayout } from '@/components/TestLayout'
import { PaginationNav } from '@/components/PaginationNav'
import { QuickIndex } from '@/components/QuickIndex'
import { PECA_ITEMS, type PecaResponses } from '@/lib/peca/engine'

export default function Page() {
  const { sessionId } = useParams()
  const [responses, setResponses] = useState<PecaResponses>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('respuestas')
        .select('*')
        .eq('session_id', sessionId)
        .eq('test', 'PECA')
        .single()

      if (data) {
        setResponses(data.respuestas)
      }
    }
    loadData()
  }, [sessionId])

  const completed = Object.keys(responses).length

  return (
    <TestLayout
      sessionId={sessionId as string}
      patientName="Paciente X"
      testName="PECA"
      testCode="PECA"
      totalItems={PECA_ITEMS.length}
      completed={completed}
      currentIndex={currentIndex}
      onNavigate={(index) => setCurrentIndex(index)}
      onSubmit={() => console.log('Enviar respuestas', responses)}
    >
      <PaginationNav
        currentPage={currentIndex}
        totalPages={PECA_ITEMS.length}
        onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
        onNext={() => setCurrentIndex((i) => Math.min(i + 1, PECA_ITEMS.length - 1))}
      />
      <QuickIndex
        totalItems={PECA_ITEMS.length}
        currentIndex={currentIndex}
        responses={responses}
        onSelect={(index) => setCurrentIndex(index)}
      />
    </TestLayout>
  )
}