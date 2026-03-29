'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { TestLayout } from '@/components/TestLayout'
import { PaginationNav } from '@/components/PaginationNav'
import { QuickIndex } from '@/components/QuickIndex'
import { BDI2_ITEMS, type BdiResponses } from '@/lib/bdi2/engine'

export default function Page() {
  const { sessionId } = useParams()
  const [responses, setResponses] = useState<BdiResponses>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('respuestas')
        .select('*')
        .eq('session_id', sessionId)
        .eq('test', 'BDI2')
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
      testName="Inventario de Depresión de Beck II"
      testCode="BDI2"
      totalItems={BDI2_ITEMS.length}
      completed={completed}
      currentIndex={currentIndex}
      onNavigate={(index) => setCurrentIndex(index)}
      onSubmit={() => console.log('Enviar respuestas', responses)}
    >
      <PaginationNav
        currentPage={currentIndex}
        totalPages={BDI2_ITEMS.length}
        onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
        onNext={() => setCurrentIndex((i) => Math.min(i + 1, BDI2_ITEMS.length - 1))}
      />
      <QuickIndex
        totalItems={BDI2_ITEMS.length}
        currentIndex={currentIndex}
        responses={responses}
        onSelect={(index) => setCurrentIndex(index)}
      />
    </TestLayout>
  )
}