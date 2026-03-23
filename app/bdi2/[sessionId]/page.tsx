'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CancelSessionButton } from '@/components/CancelSession'
import { BDI2_ITEMS, scoreBdi2, type BdiResponse, type BdiResponses } from '@/lib/bdi2/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Opciones de respuesta por ítem (0–3) según manual BDI-II
const RESPONSE_LABELS: Record<number, string[]> = {
  1:  ['No me siento triste','Me siento triste gran parte del tiempo','Me siento triste continuamente','Me siento tan triste que no puedo soportarlo'],
  2:  ['No estoy desanimado respecto al futuro','Me siento más desanimado que antes','No espero que las cosas mejoren','Siento que el futuro es desesperanzador'],
  3:  ['No me siento fracasado','He fracasado más de lo que debería','Al recordar, veo muchos fracasos','Siento que he fracasado totalmente'],
  4:  ['Obtengo el mismo placer que antes','No disfruto las cosas como antes','Obtengo muy poco placer de las cosas','No puedo obtener ningún placer'],
  5:  ['No me siento culpable','Me siento culpable por muchas cosas','Me siento bastante culpable','Me siento culpable constantemente'],
  6:  ['No siento que estoy siendo castigado','Siento que puedo ser castigado','Espero ser castigado','Siento que estoy siendo castigado'],
  7:  ['Siento lo mismo que antes sobre mí','He perdido confianza en mí mismo','Estoy decepcionado de mí mismo','No me gusto'],
  8:  ['No me critico ni me culpo más de lo habitual','Soy más crítico conmigo mismo','Me critico por todos mis fallos','Me culpo de todo lo malo que me pasa'],
  9:  ['No tengo ningún pensamiento de matarme','He tenido pensamientos de matarme','Me mataría si tuviese oportunidad','Me mataría si pudiese'],
  10: ['No lloro más de lo habitual','Lloro más que antes','Lloro por cualquier cosa','Tengo ganas de llorar pero no puedo'],
  11: ['No estoy más inquieto de lo normal','Me siento más inquieto de lo habitual','Estoy tan inquieto que me es difícil estarme quieto','Estoy tan inquieto que tengo que estar en movimiento'],
  12: ['No he perdido el interés en nada','Me intereso menos por las cosas','He perdido gran parte del interés','Me es difícil interesarme en algo'],
  13: ['Tomo decisiones como siempre','Me es más difícil tomar decisiones','Tengo grandes dificultades para tomar decisiones','No puedo tomar ninguna decisión'],
  14: ['No me considero inferior','No me considero tan valioso como antes','Me siento inferior','Me considero sin ningún valor'],
  15: ['Tengo la misma energía que antes','Tengo menos energía','No tengo suficiente energía para mucho','No tengo energía suficiente para nada'],
  16: ['No he notado cambio en mi sueño','Duermo algo más/menos que antes','Duermo bastante más/menos que antes','Duermo la mayor parte del día / no puedo dormir nada'],
  17: ['No estoy más irritable que antes','Estoy más irritable que antes','Estoy mucho más irritable','Estoy irritable constantemente'],
  18: ['No he notado cambio en mi apetito','Mi apetito es algo mayor/menor que antes','Mi apetito es bastante mayor/menor','No tengo apetito o solo pienso en comer'],
  19: ['Puedo concentrarme como siempre','No puedo concentrarme tan bien como antes','Me es difícil mantener la mente en algo','No me puedo concentrar en nada'],
  20: ['No estoy más cansado de lo habitual','Me canso más que antes','Me canso con cualquier cosa que hago','Estoy demasiado cansado para hacer la mayoría de cosas'],
  21: ['No ha habido cambio en mi interés sexual','Estoy menos interesado en el sexo','Estoy mucho menos interesado en el sexo','He perdido completamente el interés en el sexo'],
}

export default function BdiSessionPage() {
  const params    = useParams()
  const router    = useRouter()
  const sessionId = params.sessionId as string

  const [responses, setResponses] = useState<BdiResponses>({})
  const [patientName, setPatientName] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentItem, setCurrentItem] = useState(1)

  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('sessions')
      .select('patient:patients(full_name)')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        if (data) setPatientName((data.patient as any)?.full_name ?? '')
      })
  }, [sessionId])

  const handleResponse = (item: number, val: BdiResponse) => {
    setResponses((prev) => ({ ...prev, [item]: val }))
    if (item < 21) setCurrentItem(item + 1)
  }

  const completed = Object.keys(responses).length
  const pct = Math.round((completed / 21) * 100)
  const allDone = completed === 21

  const handleSubmit = async () => {
    if (!allDone) return
    setSaving(true)
    try {
      const res = await fetch('/api/bdi2/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, responses }),
      })
      if (res.ok) {
        router.push('/resultados/bdi2?session=' + sessionId)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--stone-50)' }}>
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center gap-4" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
        <div className="flex-1">
          <div className="font-medium text-sm" style={{ color: 'var(--stone-800)' }}>{patientName || 'Cargando…'}</div>
          <div className="text-xs" style={{ color: 'var(--stone-400)' }}>BDI-II — Inventario de Depresión de Beck · {completed}/21 ítems</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--teal-500)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--stone-500)' }}>{pct}%</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allDone || saving}
            className="text-xs font-medium px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: allDone && !saving ? 'var(--teal-600)' : 'var(--stone-300)', cursor: allDone && !saving ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Calculando…' : 'Ver resultados'}
          </button>
        </div>
        <CancelSessionButton sessionId={sessionId} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — lista de ítems */}
        <aside className="w-48 border-r overflow-y-auto py-3" style={{ background: 'white', borderColor: 'var(--stone-100)' }}>
          <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--stone-400)' }}>Ítems</div>
          {BDI2_ITEMS.map((item) => {
            const answered = responses[item.num] !== undefined
            const active   = currentItem === item.num
            return (
              <button
                key={item.num}
                onClick={() => setCurrentItem(item.num)}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs transition-colors"
                style={{
                  background:  active ? 'var(--stone-50)' : 'transparent',
                  color:       active ? 'var(--stone-800)' : 'var(--stone-500)',
                  borderRight: active ? '2px solid var(--teal-500)' : '2px solid transparent',
                }}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: answered ? 'var(--teal-500)' : active ? 'var(--stone-100)' : 'var(--stone-50)',
                    color: answered ? 'white' : 'var(--stone-400)',
                  }}
                >
                  {item.num}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </aside>

        {/* Panel central */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          {BDI2_ITEMS.filter((item) => item.num === currentItem).map((item) => (
            <div key={item.num} className="w-full max-w-xl">
              <div className="mb-6">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--stone-400)' }}>
                  Ítem {item.num} de 21
                </span>
                <h2 className="text-lg font-medium mt-1" style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-serif)' }}>
                  {item.label}
                </h2>
              </div>

              <div className="space-y-2">
                {(RESPONSE_LABELS[item.num] ?? ['0 — Sin síntoma','1 — Leve','2 — Moderado','3 — Grave']).map((label, idx) => {
                  const val = idx as BdiResponse
                  const selected = responses[item.num] === val
                  return (
                    <button
                      key={idx}
                      onClick={() => handleResponse(item.num, val)}
                      className="w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3"
                      style={{
                        background:   selected ? 'rgba(13,148,136,0.06)' : 'white',
                        borderColor:  selected ? 'var(--teal-500)' : 'var(--stone-200)',
                        outline:      selected ? '2px solid var(--teal-500)' : 'none',
                        outlineOffset: '-1px',
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: selected ? 'var(--teal-500)' : 'var(--stone-100)',
                          color:      selected ? 'white' : 'var(--stone-500)',
                        }}
                      >
                        {idx}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--stone-700)' }}>{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Navegación */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentItem((p) => Math.max(1, p - 1))}
                  disabled={currentItem === 1}
                  className="text-sm px-4 py-2 rounded-xl border transition-colors"
                  style={{ color: 'var(--stone-500)', borderColor: 'var(--stone-200)', background: 'white', opacity: currentItem === 1 ? 0.4 : 1 }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setCurrentItem((p) => Math.min(21, p + 1))}
                  disabled={currentItem === 21}
                  className="text-sm px-4 py-2 rounded-xl border transition-colors"
                  style={{ color: 'var(--stone-500)', borderColor: 'var(--stone-200)', background: 'white', opacity: currentItem === 21 ? 0.4 : 1 }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          ))}
        </main>

        {/* Panel derecho — puntaje en vivo */}
        <aside className="w-56 border-l p-4 flex flex-col gap-4" style={{ background: 'white', borderColor: 'var(--stone-100)' }}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--stone-400)' }}>Puntaje parcial</div>
            {completed > 0 ? (() => {
              const partial = scoreBdi2(responses)
              const color   = partial.severity === 'grave' ? '#991b1b' : partial.severity === 'moderada' ? '#9a3412' : partial.severity === 'leve' ? '#92400e' : '#166534'
              return (
                <div>
                  <div className="text-3xl font-bold" style={{ color, fontFamily: 'var(--font-serif)' }}>{partial.totalScore}</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color }}>{partial.severityLabel}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--stone-400)' }}>{completed}/21 ítems</div>
                </div>
              )
            })() : (
              <div className="text-3xl font-light" style={{ color: 'var(--stone-300)' }}>—</div>
            )}
          </div>

          {/* Alerta ideación suicida */}
          {responses[9] !== undefined && responses[9] >= 1 && (
            <div className="rounded-xl px-3 py-3 text-xs" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
              <div className="font-semibold mb-1">⚠ Ítem 9</div>
              Ideación suicida reportada (nivel {responses[9]}). Evaluar riesgo clínico.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
