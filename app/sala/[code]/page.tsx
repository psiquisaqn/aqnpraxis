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
  
  const lastMessageRef = useRef<string | null>(null)
  const displayReadySent = useRef(false)

  useEffect(() => {
    const findSession = async () => {
      const cleanCode = code.trim().toUpperCase()
      try {
        const { data, error } = await supabase
          .from('dual_sessions')
          .select('*')
          .eq('room_code', cleanCode)
          .eq('is_active', true)
          .maybeSingle()

        if (error || !data) {
          setError('Código inválido o sesión no encontrada')
          setWaiting(false)
        } else {
          setDualSessionId(data.id)
        }
      } catch (err) {
        setError('Error al conectar con el servidor')
        setWaiting(false)
      }
    }
    if (code) findSession()
  }, [code, supabase])

  const { sendMessage, connected } = useRealtime(dualSessionId || '', (payload) => {
    const messageKey = JSON.stringify(payload)
    if (lastMessageRef.current === messageKey) return
    lastMessageRef.current = messageKey
    
    if (payload.type === 'update_display') {
      setCurrentDisplay(payload.content)
      setWaiting(false)
    }
  })

  useEffect(() => {
    if (!connected || !dualSessionId || displayReadySent.current) return
    displayReadySent.current = true
    sendMessage({ type: 'display_ready', message: 'Display listo' })
  }, [connected, dualSessionId, sendMessage])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Código inválido</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Link href="/sala" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Volver al inicio</Link>
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
      // ============================================================
      // COOPERSMITH
      // ============================================================
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
            <div className="text-sm text-gray-400 mb-4">Ítem {currentDisplay.item} de {currentDisplay.totalItems || 58}</div>
            <div className="text-2xl font-medium text-gray-800 mb-6 leading-relaxed">{currentDisplay.text}</div>
            <div className="flex gap-4 justify-center">
              {currentDisplay.options?.map((opt: string, idx: number) => (
                <div key={idx} className={`px-6 py-3 rounded-xl text-sm font-medium ${currentDisplay.selected === (idx === 0 ? 'igual' : 'diferente') ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-500'}`}>{opt}</div>
              ))}
            </div>
            {currentDisplay.selected && <p className="text-xs text-green-600 mt-6">✓ Respuesta registrada</p>}
          </div>
        )

      // ============================================================
      // BDI-II
      // ============================================================
      case 'bdi2':
        const progressBdi = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 21)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1"><span>Progreso</span><span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 21}</span></div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: progressBdi + '%' }} /></div>
            </div>
            <div className="text-sm text-gray-400 mb-4">Item {currentDisplay.item} de {currentDisplay.totalItems || 21}</div>
            <div className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">{currentDisplay.label}</div>
            <div className="space-y-3 max-w-md mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div key={opt.value} className={"p-3 rounded-xl border text-sm " + (currentDisplay.selected === opt.value ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-500 border-gray-200")}>{opt.label}</div>
              ))}
            </div>
            {currentDisplay.selected !== undefined && <p className="text-xs text-green-600 mt-4">Respuesta registrada</p>}
          </div>
        )

      // ============================================================
      // PECA
      // ============================================================
      case 'peca':
        const progressPeca = ((currentDisplay.totalCompleted || 0) / (currentDisplay.totalItems || 45)) * 100
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1"><span>Progreso</span><span>{currentDisplay.totalCompleted || 0}/{currentDisplay.totalItems || 45}</span></div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: progressPeca + '%' }} /></div>
            </div>
            <div className="text-sm text-gray-400 mb-6">Item {currentDisplay.item} de {currentDisplay.totalItems || 45}</div>
            <div className="flex justify-between gap-6 mb-8">
              <span className="flex-1 text-left text-lg font-medium text-gray-800">{currentDisplay.leftPhrase}</span>
              <span className="text-gray-400 text-lg">vs</span>
              <span className="flex-1 text-right text-lg font-medium text-gray-800">{currentDisplay.rightPhrase}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
              {currentDisplay.options?.map((opt: any) => (
                <div key={opt.value} className={"p-3 rounded-xl border text-sm font-medium " + (currentDisplay.selected === opt.value ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-500 border-gray-200")}>{opt.value}</div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2 max-w-sm mx-auto px-2"><span>Izquierda</span><span>Derecha</span></div>
            {currentDisplay.selected && <p className="text-xs text-green-600 mt-4">Respuesta registrada</p>}
          </div>
        )

      // ============================================================
      // WISC-V: CC, AN, MR, RD (existentes)
      // ============================================================
      case 'wisc5_cc':
        const stimulusNum = currentDisplay.stimulusNum || 1
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1"><span>Construcción con Cubos</span><span>Ítem {stimulusNum}/{currentDisplay.totalItems || 13}</span></div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(stimulusNum / (currentDisplay.totalItems || 13)) * 100}%` }} /></div>
            </div>
            <div className="mb-8">
              <img src={`/wisc5/cc/cubos${String(stimulusNum).padStart(3, '0')}.png`} alt={`Modelo ${stimulusNum}`} className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg shadow-md" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} />
            </div>
            <div className="text-gray-600 text-sm mb-4">{currentDisplay.instructions || 'Construye la figura usando los cubos.'}</div>
            {currentDisplay.twoAttempts && <div className="text-xs text-gray-400">Intento {currentDisplay.currentAttempt || 1} de 2</div>}
          </div>
        )

      case 'wisc5_an':
        return (
          <div className="text-center">
            <div className="mb-6"><div className="flex justify-between text-sm text-gray-500 mb-1"><span>Analogías</span><span>{currentDisplay.isPractice ? 'Práctica' : `Ítem ${currentDisplay.itemNum}`}</span></div></div>
            <div className="flex justify-center items-center gap-6 md:gap-12 mb-8">
              <span className="text-2xl md:text-4xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>{currentDisplay.word1 || ''}</span>
              <span className="text-xl text-gray-400">—</span>
              <span className="text-2xl md:text-4xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>{currentDisplay.word2 || ''}</span>
            </div>
            <div className="text-gray-600 text-sm mb-4">¿Qué tienen en común?</div>
            {currentDisplay.isPractice && <div className="text-xs text-gray-400 mt-2">Ítem de práctica</div>}
          </div>
        )

      case 'wisc5_mr':
        return (
          <div className="text-center">
            <div className="mb-6"><div className="flex justify-between text-sm text-gray-500 mb-1"><span>Matrices de Razonamiento</span><span>{currentDisplay.isPractice ? 'Práctica' : `Ítem ${currentDisplay.itemNum}`}</span></div></div>
            <div className="mb-8"><img src={currentDisplay.imagePath || ''} alt={`Matriz ${currentDisplay.itemNum}`} className="mx-auto max-w-full h-auto border border-gray-200 rounded-lg shadow-md" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} /></div>
            <div className="text-gray-600 text-sm mb-4">Selecciona la opción que completa la secuencia</div>
            {currentDisplay.isPractice && <div className="text-xs text-gray-400 mt-2">Ítem de práctica</div>}
          </div>
        )

      case 'wisc5_rd':
        return (
          <div className="text-center py-8">
            <div className="mb-6"><div className="flex justify-center gap-2 mb-2"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{currentDisplay.partName || 'Retención de Dígitos'}</span>{currentDisplay.isPractice && <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Práctica</span>}</div></div>
            <div className="text-xl md:text-2xl font-medium text-gray-800 mb-6 leading-relaxed max-w-lg mx-auto px-4">{currentDisplay.instruction || 'Escucha con atención'}</div>
            <div className="mt-8 flex justify-center"><div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-blue-500"><path d="M12 4C9.5 4 7 5 5 7C3 9 2 12 2 12C2 12 3 15 5 17C7 19 9.5 20 12 20C14.5 20 17 19 19 17C21 15 22 12 22 12C22 12 21 9 19 7C17 5 14.5 4 12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg></div></div>
            <p className="text-gray-500 text-sm mt-6">Escucha los números y responde al evaluador</p>
            <div className="mt-4 text-xs text-gray-400">{currentDisplay.part === 'RD-D' ? 'Orden directo' : currentDisplay.part === 'RD-I' ? 'Orden inverso' : 'Orden secuenciado'}</div>
          </div>
        )

      // ============================================================
      // WISC-V: CLA, VOC, BAL (nuevos - solo instrucciones o imagen)
      // ============================================================
      case 'wisc5_cla':
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Claves</span></div>
            <div className="text-xl font-medium text-gray-800 mb-4">{currentDisplay.instruction || 'Copia los símbolos en las casillas correspondientes.'}</div>
            <p className="text-gray-500 text-sm mt-8">Trabaja lo más rápido que puedas. Tienes 2 minutos.</p>
          </div>
        )

      case 'wisc5_voc':
        const isImage = currentDisplay.hasImage && currentDisplay.imagePath
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Vocabulario</span></div>
            {isImage ? (
              <div className="mb-6"><img src={currentDisplay.imagePath} alt={`Ítem ${currentDisplay.itemNum}`} className="mx-auto max-h-64 object-contain rounded-lg border border-gray-200" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} /></div>
            ) : (
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>{currentDisplay.word || ''}</div>
            )}
            <p className="text-gray-600 text-sm">{currentDisplay.instruction || '¿Qué significa esta palabra?'}</p>
          </div>
        )

      case 'wisc5_bal':
        return (
          <div className="text-center py-4">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Balanzas</span>{currentDisplay.isPractice && <span className="ml-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Práctica</span>}</div>
            <div className="bg-white rounded-lg p-4 border border-gray-200"><img src={currentDisplay.imagePath || ''} alt={`Balanza ${currentDisplay.itemNum}`} className="mx-auto max-w-full h-auto" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} /></div>
            <p className="text-gray-500 text-sm mt-4">Elige la opción correcta entre 5 alternativas</p>
          </div>
        )

      case 'wisc5_rv':
        return (
          <div className="text-center py-4">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Rompecabezas Visuales</span>{currentDisplay.isPractice && <span className="ml-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Práctica</span>}</div>
            <div className="bg-white rounded-lg p-4 border border-gray-200"><img src={currentDisplay.imagePath || ''} alt={`RV ${currentDisplay.itemNum}`} className="mx-auto max-w-full h-auto" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} /></div>
            <p className="text-gray-500 text-sm mt-4">Selecciona 3 opciones correctas de 6</p>
          </div>
        )

      case 'wisc5_ri':
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Retención de Imágenes</span>{currentDisplay.isPractice && <span className="ml-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Práctica</span>}</div>
            {currentDisplay.phase === 'showing' && currentDisplay.stimulusImage ? (
              <div className="mb-6">
                <p className="text-sm text-blue-600 mb-3">Observa con atención ({currentDisplay.timeRemaining}s)</p>
                <img src={currentDisplay.stimulusImage} alt="Estímulo" className="mx-auto max-h-64 object-contain rounded-lg border border-gray-200" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} />
              </div>
            ) : currentDisplay.phase === 'answering' && currentDisplay.optionsImage ? (
              <div className="mb-6">
                <p className="text-sm text-green-600 mb-3">¿Qué imágenes viste?</p>
                <img src={currentDisplay.optionsImage} alt="Opciones" className="mx-auto max-h-64 object-contain rounded-lg border border-gray-200" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} />
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-8">Prepárate para observar las imágenes</p>
            )}
          </div>
        )

      case 'wisc5_bs':
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Búsqueda de Símbolos - Forma {currentDisplay.form || 'A'}</span></div>
            <div className="text-xl font-medium text-gray-800 mb-4">{currentDisplay.instruction || 'Busca los símbolos iguales al modelo y márcalos.'}</div>
            <p className="text-gray-500 text-sm mt-8">Trabaja lo más rápido que puedas. Tienes 2 minutos.</p>
          </div>
        )

      case 'wisc5_in':
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Información</span></div>
            <div className="text-xl md:text-2xl font-medium text-gray-800 mb-4 leading-relaxed max-w-lg mx-auto px-4">{currentDisplay.question || ''}</div>
            {currentDisplay.tips && <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-left max-w-md mx-auto"><p className="text-xs text-yellow-700">{currentDisplay.tips}</p></div>}
          </div>
        )

      case 'wisc5_sln':
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Secuenciación de Letras y Números</span></div>
            <div className="text-xl md:text-2xl font-medium text-gray-800 mb-6 leading-relaxed max-w-lg mx-auto px-4">{currentDisplay.instruction || 'Escucha con atención las instrucciones del evaluador'}</div>
            <div className="mt-8 flex justify-center"><div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-3xl">🔢</div></div>
            <p className="text-gray-500 text-sm mt-6">Escucha los números y letras, luego responde en orden</p>
          </div>
        )

      case 'wisc5_can':
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Cancelación - {currentDisplay.part || ''}</span></div>
            <div className="text-xl font-medium text-gray-800 mb-4">{currentDisplay.instruction || 'Tacha los animales que sean iguales al modelo.'}</div>
            <p className="text-gray-500 text-sm mt-8">Parte {currentDisplay.partIndex || 1} de {currentDisplay.totalParts || 2}. Trabaja lo más rápido que puedas.</p>
          </div>
        )

      case 'wisc5_com':
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Comprensión</span></div>
            <div className="text-xl md:text-2xl font-medium text-gray-800 mb-4 leading-relaxed max-w-lg mx-auto px-4">{currentDisplay.question || ''}</div>
          </div>
        )

      case 'wisc5_ari':
        const hasAriImage = currentDisplay.hasImage && currentDisplay.imagePath
        return (
          <div className="text-center py-8">
            <div className="mb-4"><span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Aritmética</span>{currentDisplay.isLearning && <span className="ml-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Aprendizaje</span>}</div>
            {hasAriImage ? (
              <div className="mb-6"><img src={currentDisplay.imagePath} alt={`Ítem ${currentDisplay.itemNum}`} className="mx-auto max-h-48 object-contain rounded-lg border border-gray-200" onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }} /></div>
            ) : (
              <div className="text-lg md:text-xl font-medium text-gray-800 mb-4 leading-relaxed max-w-lg mx-auto px-4">{currentDisplay.question || ''}</div>
            )}
          </div>
        )

      // ============================================================
      // DEFAULT
      // ============================================================
      default:
        return (
          <div className="text-center">
            <div className="text-2xl font-medium text-gray-800 mb-4">{currentDisplay.item || 'Preparando evaluación...'}</div>
            <div className="text-gray-600">{currentDisplay.content || 'Esperando instrucciones...'}</div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="fixed top-4 right-4 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M8 12L4 8L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver al panel principal
        </Link>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-4"><div className="text-sm text-gray-400">Código de sala: {code}</div></div>

        {waiting && !currentDisplay ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Esperando al psicólogo</h2>
            <p className="text-gray-400 text-sm">La evaluación comenzará en breve. Por favor, espera las instrucciones.</p>
            <div className="mt-6 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
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