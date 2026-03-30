'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// Items de ejemplo para BDI-II (21 items)
const BDI_ITEMS = [
  { id: 1, question: "Tristeza", options: [
    "No me siento triste",
    "Me siento triste gran parte del tiempo",
    "Estoy triste todo el tiempo",
    "Estoy tan triste o infeliz que no puedo soportarlo"
  ]},
  { id: 2, question: "Pesimismo", options: [
    "No estoy desanimado respecto a mi futuro",
    "Me siento más desanimado respecto a mi futuro que antes",
    "No espero que las cosas mejoren",
    "Siento que no hay esperanza y que todo empeorará"
  ]},
  // Agrega más items según necesites
]

interface DualSession {
  id: string
  session_id: string
  room_code: string
  is_active: boolean
}

interface Session {
  id: string
  patient_id: string
  test_id: string
  status: string
}

interface Respuesta {
  id: string
  item_id: number
  respuesta: string
  puntaje: number
  created_at: string
}

export default function DualControlPage() {
  const params = useParams()
  const router = useRouter()
  const dualSessionId = params.dualSessionId as string

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [dualSession, setDualSession] = useState<DualSession | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [respuestas, setRespuestas] = useState<Respuesta[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completado, setCompletado] = useState(false)

  const items = BDI_ITEMS // Por ahora usamos BDI-II como ejemplo

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== CARGANDO SESIÓN DUAL ===')
        
        // Obtener la sesión dual
        const { data: dualData, error: dualError } = await supabase
          .from('dual_sessions')
          .select('*')
          .eq('id', dualSessionId)
          .single()

        if (dualError) throw dualError
        setDualSession(dualData)

        // Obtener la sesión
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', dualData.session_id)
          .single()

        if (sessionError) throw sessionError
        setSession(sessionData)

        // Obtener respuestas existentes
        const { data: respuestasData, error: respuestasError } = await supabase
          .from('resultados')
          .select('*')
          .eq('session_id', dualData.session_id)
          .order('created_at', { ascending: true })

        if (!respuestasError && respuestasData) {
          setRespuestas(respuestasData)
          setCurrentItemIndex(respuestasData.length)
          if (respuestasData.length >= items.length) {
            setCompletado(true)
          }
        }

        setLoading(false)
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    if (dualSessionId) {
      loadData()
    }
  }, [dualSessionId, supabase, items.length])

  const handleResponder = async (puntaje: number, respuestaTexto: string) => {
    if (completado) return

    const itemActual = items[currentItemIndex]
    
    const { data: nuevaRespuesta, error } = await supabase
      .from('resultados')
      .insert({
        session_id: session!.id,
        item_id: itemActual.id,
        respuesta: respuestaTexto,
        puntaje: puntaje,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error guardando respuesta:', error)
      return
    }

    const nuevasRespuestas = [...respuestas, nuevaRespuesta]
    setRespuestas(nuevasRespuestas)
    
    const nextIndex = currentItemIndex + 1
    
    if (nextIndex >= items.length) {
      setCompletado(true)
      
      // Calcular puntaje total
      const puntajeTotal = nuevasRespuestas.reduce((sum, r) => sum + r.puntaje, 0)
      
      // Actualizar sesión
      await supabase
        .from('sessions')
        .update({ 
          puntaje_total: puntajeTotal,
          status: 'completed',
          fecha_fin: new Date().toISOString()
        })
        .eq('id', session!.id)
      
      alert(`✅ Evaluación completada!\nPuntaje total: ${puntajeTotal}`)
    } else {
      setCurrentItemIndex(nextIndex)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando sesión de control...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-700 font-semibold mb-2">Error:</h2>
          <p className="text-red-600">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
            Volver
          </button>
        </div>
      </div>
    )
  }

  const itemActual = !completado && currentItemIndex < items.length ? items[currentItemIndex] : null

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Control de Evaluación Dual</h1>
              <p className="text-gray-600 mt-1">
                Test: {session?.test_id} | Progreso: {respuestas.length}/{items.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Código de sala:</div>
              <div className="text-2xl font-mono font-bold text-blue-600">{dualSession?.room_code}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Control - Ítems */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {completado ? '✅ Evaluación completada' : `Ítem ${currentItemIndex + 1} de ${items.length}`}
            </h2>
            
            {itemActual && !completado ? (
              <div>
                <p className="text-lg font-medium text-gray-800 mb-6">
                  {itemActual.question}
                </p>
                
                <div className="space-y-3">
                  {itemActual.options.map((opcion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResponder(idx, opcion)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      {opcion}
                    </button>
                  ))}
                </div>
              </div>
            ) : completado ? (
              <div className="text-center py-8">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <p className="text-gray-600">
                  Puntaje total: {respuestas.reduce((sum, r) => sum + r.puntaje, 0)} puntos
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Cargando ítems...</p>
            )}
          </div>
          
          {/* Panel de Respuestas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Respuestas registradas</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {respuestas.map((resp, idx) => (
                <div key={resp.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">#{idx + 1}</span>
                    <span className="text-sm text-blue-600">{resp.puntaje} pts</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{resp.respuesta}</p>
                </div>
              ))}
              {respuestas.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  Aún no hay respuestas registradas.
                  <br />
                  Selecciona una opción para comenzar.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            ← Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
