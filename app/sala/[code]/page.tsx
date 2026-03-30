'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'

export default function SalaPage() {
  const params = useParams()
  const code = params.code as string
  
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  
  const [session, setSession] = useState<any>(null)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      // Obtener la sesión por código
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
        setLoading(false)
        return
      }

      setSession(sessionData)
      
      // Escuchar cambios en tiempo real para mostrar el ítem actual
      const subscription = supabase
        .channel(`session:${sessionData.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessions',
            filter: `id=eq.${sessionData.id}`,
          },
          (payload) => {
            // Cuando el psicólogo cambie el ítem actual
            if (payload.new.current_item) {
              setCurrentItem(payload.new.current_item)
            }
          }
        )
        .subscribe()

      setLoading(false)

      return () => {
        subscription.unsubscribe()
      }
    }

    loadSession()
  }, [code, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando sala...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Sala no encontrada</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Evaluación Psicológica
          </h1>
          <p className="text-gray-600">
            Sala: {code}
          </p>
        </div>

        {/* Contenido de la evaluación */}
        <div className="bg-white rounded-lg shadow p-8">
          {currentItem ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                {currentItem.pregunta || currentItem.texto}
              </h2>
              
              {/* Aquí se mostrarían las opciones si el paciente pudiera responder directamente */}
              <div className="space-y-3">
                {currentItem.opciones?.map((opcion: any, idx: number) => (
                  <button
                    key={idx}
                    disabled
                    className="w-full text-left p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  >
                    {opcion.texto}
                  </button>
                ))}
              </div>
              
              <p className="mt-6 text-sm text-gray-400 text-center">
                Esperando indicaciones del psicólogo...
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                Esperando que el psicólogo inicie la evaluación...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
