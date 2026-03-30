'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function SalaPage() {
  const params = useParams()
  const code = params.code as string
  
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [encontrado, setEncontrado] = useState(false)

  const addDebug = (msg: string) => {
    console.log(msg)
    setDebugInfo(prev => [...prev, msg])
  }

  useEffect(() => {
    const init = async () => {
      try {
        addDebug('1. Iniciando búsqueda para código: ' + code)
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        addDebug('2. Cliente Supabase creado')
        addDebug('3. Buscando en dual_sessions con room_code: ' + code.toUpperCase())
        
        const { data, error } = await supabase
          .from('dual_sessions')
          .select('*')
          .eq('room_code', code.toUpperCase())
          .eq('is_active', true)
        
        addDebug('4. Resultado de búsqueda: ' + JSON.stringify({ data: data?.length, error: error?.message }))
        
        if (error) {
          addDebug('❌ Error: ' + error.message)
          setError(error.message)
          return
        }
        
        if (!data || data.length === 0) {
          addDebug('❌ No se encontró ninguna sala con código: ' + code.toUpperCase())
          setError(`No se encontró la sala "${code.toUpperCase()}"`)
          return
        }
        
        addDebug('✅ Sala encontrada! ID: ' + data[0].id)
        addDebug('📝 Room code: ' + data[0].room_code)
        addDebug('🔘 is_active: ' + data[0].is_active)
        setEncontrado(true)
        
      } catch (err: any) {
        addDebug('❌ Error inesperado: ' + err.message)
        setError(err.message)
      }
    }
    
    init()
  }, [code])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Sala de Evaluación</h1>
          <p className="text-gray-600 mb-4">
            Código ingresado: <span className="font-mono font-bold text-xl">{code}</span>
          </p>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-600 font-semibold">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : encontrado ? (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
              <p className="text-green-600 font-semibold">✅ Sala encontrada!</p>
              <p className="text-green-600 mt-2">Conectando a la evaluación...</p>
            </div>
          ) : null}
          
          <div className="bg-gray-100 rounded p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Debug info:</p>
            <div className="space-y-1 text-xs font-mono text-gray-600 max-h-96 overflow-auto">
              {debugInfo.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <a href="/sala" className="text-blue-600 hover:text-blue-800">
              ← Volver a ingresar código
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
