'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PECA_ITEMS, scorePeca, type PecaResponses } from '@/lib/peca/engine'

export default function Peca({ dualSessionId }: { dualSessionId: string }) {
  const router = useRouter()
  const [responses, setResponses] = useState<PecaResponses[]>([])
  const [resultados, setResultados] = useState<any[]>([])

  // Guardar respuestas del paciente
  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('respuestas')
      .insert({
        session_id: dualSessionId,
        test: 'PECA',
        respuestas: responses,
      })

    if (error) {
      console.error('Error al guardar respuestas:', error)
    } else {
      console.log('Respuestas guardadas:', data)
    }
  }

  // Traer resultados del test
  useEffect(() => {
    const fetchResultados = async () => {
      const { data, error } = await supabase
        .from('resultados')
        .select('*')
        .eq('session_id', dualSessionId)
        .eq('test', 'PECA')

      if (error) {
        console.error('Error al traer resultados:', error)
      } else {
        setResultados(data)
      }
    }

    fetchResultados()
  }, [dualSessionId])

  return (
    <div>
      <h1>Evaluación PECA</h1>
      {/* Aquí iría tu lógica para mostrar preguntas y capturar respuestas */}
      <button onClick={handleSubmit}>Guardar respuestas</button>

      <h2>Resultados</h2>
      <pre>{JSON.stringify(resultados, null, 2)}</pre>
    </div>
  )
}