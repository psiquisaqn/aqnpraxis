/**
 * /peca/[sessionId] — Cuestionario PECA autoadministrado
 *
 * El evaluado responde directamente los 45 ítems en su dispositivo.
 * Diseño limpio, intuitivo y sin jerga técnica.
 * Al finalizar, envía las respuestas al motor y redirige al psicólogo.
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { PECA_ITEMS } from '@/lib/peca/engine'
import { CancelSessionButton } from '@/components/CancelSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ITEMS_PER_PAGE = 5

type Responses = Record<number, number>

// ─── Componente de ítem ───────────────────────────────────────

function PecaItemCard({
  item,
  value,
  onChange,
}: {
  item: typeof PECA_ITEMS[0]
  value?: number
  onChange: (val: number) => void
}) {
  return (
    <div className={`rounded-2xl border p-5 transition-all duration-200 ${
      value ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50'
    }`}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Frase izquierda */}
        <p className={`text-sm leading-relaxed text-right transition-colors ${
          value && value <= 2 ? 'text-slate-800 font-medium' : 'text-slate-500'
        }`}>
          {item.leftPhrase}
        </p>

        {/* Botones 1–2–3–4 */}
        <div className="flex gap-2 flex-shrink-0">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-150
                ${value === n
                  ? n <= 2
                    ? 'bg-slate-800 text-white scale-110'
                    : 'bg-indigo-600 text-white scale-110'
                  : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600'
                }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Frase derecha */}
        <p className={`text-sm leading-relaxed transition-colors ${
          value && value >= 3 ? 'text-slate-800 font-medium' : 'text-slate-500'
        }`}>
          {item.rightPhrase}
        </p>
      </div>

      {/* Indicador visual de tendencia */}
      {value && (
        <div className="mt-3 flex items-center gap-1 justify-center">
          <div className={`h-1 rounded-full transition-all duration-300 ${
            value === 1 ? 'w-20 bg-slate-600' :
            value === 2 ? 'w-10 bg-slate-400' :
            value === 3 ? 'w-10 bg-indigo-400' :
            'w-20 bg-indigo-600'
          }`} />
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────

export default function PecaQuestionnaire() {
  const params    = useParams()
  const router    = useRouter()
  const sessionId = params.sessionId as string

  const [responses, setResponses]   = useState<Responses>({})
  const [page, setPage]             = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [started, setStarted]       = useState(false)

  // Cargar nombre del paciente
  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('sessions')
      .select('patient:patients(full_name)')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        setPatientName((data?.patient as any)?.full_name ?? '')
      })
  }, [sessionId])

  const totalPages  = Math.ceil(PECA_ITEMS.length / ITEMS_PER_PAGE)
  const pageItems   = PECA_ITEMS.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
  const pageAnswered = pageItems.every(item => responses[item.id] !== undefined)
  const totalAnswered = Object.keys(responses).length
  const progress    = Math.round((totalAnswered / 45) * 100)
  const isLastPage  = page === totalPages - 1

  const handleResponse = (itemId: number, value: number) => {
    setResponses(prev => ({ ...prev, [itemId]: value }))
  }

  const handleNext = () => {
    if (page < totalPages - 1) {
      setPage(p => p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (page > 0) {
      setPage(p => p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(responses).length < 45) return
    setSubmitting(true)
    try {
      await fetch('/api/peca/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, responses }),
      })
      // Redirigir a pantalla de finalización
      router.push(`/peca/${sessionId}/done`)
    } catch {
      setSubmitting(false)
    }
  }

  // ─── Pantalla de inicio ──────────────────────────────────────

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-10 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="font-serif text-lg font-normal text-slate-800">
              Psiquis <strong className="tracking-wider">AQN</strong>
            </span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-slate-800" />
              <div className="w-2.5 h-2.5 border-[1.5px] border-slate-800" />
            </div>
          </div>

          <h1 className="text-2xl font-light text-slate-800 mb-2 font-serif">
            Cuestionario de Conducta Adaptativa
          </h1>
          {patientName && (
            <p className="text-sm text-slate-400 mb-8">Preparado para {patientName}</p>
          )}

          <div className="bg-slate-50 rounded-2xl p-5 text-left mb-8 space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              A continuación verás <strong>45 preguntas</strong>. En cada una hay dos frases contrapuestas. Elige la opción que más se acerque a cómo eres tú:
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="flex gap-1.5">
                {[1,2,3,4].map(n => (
                  <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
                    n<=2 ? 'border-slate-300 text-slate-500' : 'border-indigo-200 text-indigo-400'
                  }`}>{n}</div>
                ))}
              </div>
              <p><strong>1–2</strong> te identificas con la frase izquierda · <strong>3–4</strong> con la frase derecha</p>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              No hay respuestas correctas ni incorrectas. Responde según cómo eres tú habitualmente, no como te gustaría ser.
            </p>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full bg-slate-900 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Comenzar cuestionario
          </button>
        </div>
      </div>
    )
  }

  // ─── Cuestionario ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header fijo */}
      <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">
              PECA · Preguntas {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, 45)} de 45
            </span>
            <span className="text-xs text-slate-400">{progress}% completado</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-800 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instrucción de página */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-2">
        <p className="text-xs text-center text-slate-400 mb-6">
          Elige <strong>1</strong> o <strong>2</strong> si te identificas con la frase de la izquierda ·
          Elige <strong>3</strong> o <strong>4</strong> si te identificas con la de la derecha
        </p>
      </div>

      {/* Ítems */}
      <div className="max-w-2xl mx-auto px-6 pb-6 space-y-4">
        {pageItems.map(item => (
          <PecaItemCard
            key={item.id}
            item={item}
            value={responses[item.id]}
            onChange={val => handleResponse(item.id, val)}
          />
        ))}
      </div>

      {/* Navegación */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div className="flex gap-3">
          {page > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              ← Anterior
            </button>
          )}
          {!isLastPage ? (
            <button
              onClick={handleNext}
              disabled={!pageAnswered}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                pageAnswered
                  ? 'bg-slate-900 text-white hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              {pageAnswered ? 'Siguiente →' : `Responde todas las preguntas (${pageItems.filter(i => !responses[i.id]).length} restantes)`}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={totalAnswered < 45 || submitting}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                totalAnswered >= 45 && !submitting
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Enviando…' : totalAnswered < 45 ? `Faltan ${45 - totalAnswered} preguntas` : '✓ Enviar respuestas'}
            </button>
          )}
        </div>

        {/* Indicadores de página */}
        <div className="flex justify-center gap-1.5 mt-5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === page ? 'w-6 bg-slate-800' :
                i < page ? 'w-3 bg-slate-400' : 'w-3 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
