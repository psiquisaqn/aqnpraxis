'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useRealtime } from '@/hooks/useRealtime'

export default function SalaDisplayPage() {
  const params = useParams()
  const code = params.code as string

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [currentDisplay, setCurrentDisplay] = useState<any>(null)
  const [waiting, setWaiting] = useState(true)
  const [dualSessionId, setDualSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Para evitar mensajes duplicados
  const lastMessageRef = useRef<string | null>(null)
  const displayReadySent = useRef(false)

  // Buscar sesión dual por código
  useEffect(() => {
    const findSession = async () => {
      const cleanCode = code.trim().toUpperCase()
      console.log('=== BÚSQUEDA DE SALA ===')
      console.log('Código original:', code)
      console.log('Código limpio:', cleanCode)
      
      try {
        const { data, error } = await supabase
          .from('dual_sessions')
          .select('*')
          .eq('room_code', cleanCode)
          .eq('is_active', true)
          .maybeSingle()

        if (error || !data) {
          console.log('No se encontró sala')
          setError('Código inválido o sesión no encontrada')
          setWaiting(false)
        } else {
          console.log('✅ Sala encontrada! ID:', data.id)
          setDualSessionId(data.id)
        }
      } catch (err) {
        console.error('Error inesperado:', err)
        setError('Error al conectar con el servidor')
        setWaiting(false)
      }
    }

    if (code) {
      findSession()
    }
  }, [code, supabase])

  // Escuchar comandos del psicólogo - con prevención de duplicados
  const { sendMessage, connected } = useRealtime(dualSessionId || '', (payload) => {
    console.log('📨 Mensaje recibido en display:', payload)
    
    // Evitar procesar el mismo mensaje repetidamente
    const messageKey = JSON.stringify(payload)
    if (lastMessageRef.current === messageKey) {
      console.log('⚠️ Mensaje duplicado ignorado')
      return
    }
    lastMessageRef.current = messageKey
    
    if (payload.type === 'update_display') {
      console.log('🖥️ Actualizando display con:', payload.content)
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })

  // Enviar display_ready solo una vez
  useEffect(() => {
    if (!connected || !dualSessionId || displayReadySent.current) return
    displayReadySent.current = true
    console.log('📡 Enviando display_ready (única vez)')
    sendMessage({ type: 'display_ready', message: 'Display listo' })
  }, [connected, dualSessionId, sendMessage])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Código inválido</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Link href="/sala" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (!dualSessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Buscando evaluación...</p>
        </div>
      </div>
    )
  }

  const renderDisplay = () => {
    if (!currentDisplay) return null

    switch (currentDisplay.type) {
      case 'coopersmith':
        const progress = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 58)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 58}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              Ítem {currentDisplay.item} de {currentDisplay.totalItems || 58}
            </div>
            <div className="text-2xl font-medium text-gray-800 mb-6 leading-relaxed">
              {currentDisplay.text}
            </div>
            <div className="flex gap-4 justify-center">
              {currentDisplay.options?.map((opt: string, idx: number) => (
                <div
                  key={idx}
                  className={`px-6 py-3 rounded-xl text-sm font-medium ${
                    currentDisplay.selected === (idx === 0 ? 'igual' : 'diferente')
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
            {currentDisplay.selected && (
              <p className="text-xs text-green-600 mt-6 flex items-center justify-center gap-1">
                ✓ Respuesta registrada
              </p>
            )}
          </div>
        )

      case 'bdi2':
        const progressBdi = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 21)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 21}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: progressBdi + '%' }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">Item {currentDisplay.item} de {currentDisplay.totalItems || 21}</div>
            <div className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">{currentDisplay.label}</div>
            <div className="space-y-3 max-w-md mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div key={opt.value}
                  className={"p-3 rounded-xl border text-sm " + (currentDisplay.selected === opt.value ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-500 border-gray-200")}
                >
                  {opt.label}
                </div>
              ))}
            </div>
            {currentDisplay.selected !== undefined && <p className="text-xs text-green-600 mt-4">Respuesta registrada</p>}
          </div>
        )

      case 'peca':
        const progressPeca = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 45)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 45}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: progressPeca + '%' }} />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-6">Item {currentDisplay.item} de {currentDisplay.totalItems || 45}</div>
            <div className="flex justify-between gap-6 mb-8">
              <span className="flex-1 text-left text-lg font-medium text-gray-800">{currentDisplay.leftPhrase}</span>
              <span className="text-gray-400 text-lg">vs</span>
              <span className="flex-1 text-right text-lg font-medium text-gray-800">{currentDisplay.rightPhrase}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div key={opt.value}
                  className={"p-3 rounded-xl border text-sm font-medium " + (currentDisplay.selected === opt.value ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-500 border-gray-200")}
                >
                  {opt.value}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2 max-w-sm mx-auto px-2">
              <span>Izquierda</span><span>Derecha</span>
            </div>
            {currentDisplay.selected && <p className="text-xs text-green-600 mt-4">Respuesta registrada</p>}
          </div>
        )

      // ============================================================
      // WISC-V - Construcción con Cubos (CC)
      // ============================================================
      case 'wisc5_cc':
        const stimulusNum = currentDisplay.stimulusNum || 1
        const imagePath = `/wisc5/cc/cubos${String(stimulusNum).padStart(3, '0')}.png`
        const isTwoAttempts = currentDisplay.twoAttempts || false
        const currentAttempt = currentDisplay.currentAttempt || 1
        const totalItems = currentDisplay.totalItems || 13
        
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Construcción con Cubos</span>
                <span>Ítem {stimulusNum}/{totalItems}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(stimulusNum / totalItems) * 100}%` }} />
              </div>
            </div>
            
            <div className="mb-8">
              <img 
                src={imagePath} 
                alt={`Modelo ${stimulusNum}`}
                className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg shadow-md"
                onError={(e) => {
                  console.error(`Error cargando imagen: ${imagePath}`)
                  e.currentTarget.src = '/placeholder-image.png'
                }}
              />
            </div>
            
            <div className="text-gray-600 text-sm mb-4">
              {currentDisplay.instructions || 'Construye la figura usando los cubos. Observa el modelo y repite la construcción.'}
            </div>
            
            {isTwoAttempts && (
              <div className="text-xs text-gray-400">Intento {currentAttempt} de 2</div>
            )}
            
            {currentDisplay.selected !== undefined && (
              <p className="text-xs text-green-600 mt-4">✓ Respuesta registrada</p>
            )}
          </div>
        )

      // ============================================================
      // WISC-V - Analogías (AN)
      // ============================================================
      case 'wisc5_an':
        const word1 = currentDisplay.word1 || ''
        const word2 = currentDisplay.word2 || ''
        const itemNumAn = currentDisplay.itemNum || ''
        const isPracticeAn = currentDisplay.isPractice || false
        
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Analogías</span>
                <span>{isPracticeAn ? 'Práctica' : `Ítem ${itemNumAn}`}</span>
              </div>
            </div>
            
            <div className="flex justify-center items-center gap-6 md:gap-12 mb-8">
              <span className="text-2xl md:text-4xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
                {word1}
              </span>
              <span className="text-xl text-gray-400">—</span>
              <span className="text-2xl md:text-4xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
                {word2}
              </span>
            </div>
            
            <div className="text-gray-600 text-sm mb-4">
              ¿Qué tienen en común? ¿Qué clase o categoría une estas dos palabras?
            </div>
            
            {isPracticeAn && (
              <div className="text-xs text-gray-400 mt-2">Ítem de práctica</div>
            )}
          </div>
        )

      // ============================================================
      // WISC-V - Matrices de Razonamiento (MR)
      // ============================================================
      case 'wisc5_mr':
        const imagePathMr = currentDisplay.imagePath || ''
        const itemNumMr = currentDisplay.itemNum || ''
        const isPracticeMr = currentDisplay.isPractice || false
        
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Matrices de Razonamiento</span>
                <span>{isPracticeMr ? 'Práctica' : `Ítem ${itemNumMr}`}</span>
              </div>
            </div>
            
            <div className="mb-8">
              <img 
                src={imagePathMr} 
                alt={`Matriz ${itemNumMr}`}
                className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg shadow-md"
                onError={(e) => {
                  console.error(`Error cargando imagen: ${imagePathMr}`)
                  e.currentTarget.src = '/placeholder-image.png'
                }}
              />
            </div>
            
            <div className="text-gray-600 text-sm mb-4">
              Selecciona la opción que completa la secuencia
            </div>
            
            {isPracticeMr && (
              <div className="text-xs text-gray-400 mt-2">Ítem de práctica</div>
            )}
          </div>
        )

      // ============================================================
      // WISC-V - Retención de Dígitos (RD)
      // ============================================================
      case 'wisc5_rd':
        const partName = currentDisplay.partName || 'Retención de Dígitos'
        const instruction = currentDisplay.instruction || 'Escucha con atención las instrucciones del evaluador'
        const isPracticeRd = currentDisplay.isPractice || false
        const part = currentDisplay.part || 'RD-D'
        
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {partName}
                </span>
                {isPracticeRd && (
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    Práctica
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-xl md:text-2xl font-medium text-gray-800 mb-6 leading-relaxed max-w-lg mx-auto px-4">
              {instruction}
            </div>
            
            <div className="mt-8 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                  <path d="M12 4C9.5 4 7 5 5 7C3 9 2 12 2 12C2 12 3 15 5 17C7 19 9.5 20 12 20C14.5 20 17 19 19 17C21 15 22 12 22 12C22 12 21 9 19 7C17 5 14.5 4 12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            
            <p className="text-gray-500 text-sm mt-6">
              Escucha los números y responde al evaluador
            </p>
            
            <div className="mt-4 text-xs text-gray-400">
              {part === 'RD-D' && 'Orden directo - Repite en el MISMO orden'}
              {part === 'RD-I' && 'Orden inverso - Repite AL REVÉS'}
              {part === 'RD-S' && 'Orden secuenciado - Repite de MENOR a MAYOR'}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center">
            <div className="text-2xl font-medium text-gray-800 mb-4">
              {currentDisplay.item || 'Preparando evaluación...'}
            </div>
            <div className="text-gray-600">
              {currentDisplay.content || 'Esperando instrucciones...'}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="fixed top-4 right-4 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 8H4M8 12L4 8L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver al panel principal
        </Link>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400">Código de sala: {code}</div>
        </div>

        {waiting && !currentDisplay ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Esperando al psicólogo</h2>
            <p className="text-gray-400 text-sm">La evaluación comenzará en breve. Por favor, espera las instrucciones.</p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : currentDisplay ? (
          renderDisplay()
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Tiempo de espera agotado</h2>
            <p className="text-gray-400 text-sm">La evaluación no ha comenzado. Contacta al psicólogo.</p>
          </div>
        )}
      </div>
    </div>
  )
}