'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CancelSessionButton } from '@/components/CancelSession'
import { COOPERSMITH_ITEMS, scoreCoopersmith, type CooperResponse, type CooperResponses } from '@/lib/coopersmith/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ITEMS_PER_PAGE = 10

export default function CoopersmithSessionPage() {
  const params    = useParams()
  const router    = useRouter()
  const sessionId = params.sessionId as string

  const [responses, setResponses]     = useState<CooperResponses>({})
  const [patientName, setPatientName] = useState('')
  const [page, setPage]               = useState(0)
  const [saving, setSaving]           = useState(false)

  const totalPages = Math.ceil(COOPERSMITH_ITEMS.length / ITEMS_PER_PAGE)
  const pageItems  = COOPERSMITH_ITEMS.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
  const completed  = Object.keys(responses).length
  const pct        = Math.round((completed / 58) * 100)
  const allDone    = completed === 58

  useEffect(() => {
    if (!sessionId) return
    supabase.from('sessions').select('patient:patients(full_name)').eq('id', sessionId).single()
      .then(({ data }) => { if (data) setPatientName((data.patient as any)?.full_name ?? '') })
  }, [sessionId])

  const handleResponse = (item: number, val: CooperResponse) => {
    setResponses((prev) => ({ ...prev, [item]: val }))
  }

  const handleSubmit = async () => {
    if (!allDone) return
    setSaving(true)
    try {
      const res = await fetch('/api/coopersmith/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, responses }),
      })
      if (res.ok) router.push('/resultados/coopersmith?session=' + sessionId)
    } finally {
      setSaving(false)
    }
  }

  const partial = completed > 0 ? scoreCoopersmith(responses) : null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--stone-50)' }}>
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center gap-4" style={{ background: 'white', borderColor: 'var(--stone-200)' }}>
        <div className="flex-1">
          <div className="font-medium text-sm" style={{ color: 'var(--stone-800)' }}>{patientName || 'Cargando…'}</div>
          <div className="text-xs" style={{ color: 'var(--stone-400)' }}>Coopersmith SEI — Inventario de Autoestima · {completed}/58 ítems</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--teal-500)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--stone-500)' }}>{pct}%</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allDone || saving}
            className="text-xs font-medium px-4 py-2 rounded-xl text-white"
            style={{ background: allDone && !saving ? 'var(--teal-600)' : 'var(--stone-300)', cursor: allDone && !saving ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Calculando…' : 'Ver resultados'}
          </button>
        </div>
        <CancelSessionButton sessionId={sessionId} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel central */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Instrucción */}
            {page === 0 && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)', color: 'var(--stone-700)' }}>
                Lee cada frase y marca si es <strong>"Igual que yo"</strong> o <strong>"No es como yo"</strong>.
              </div>
            )}

            <div className="space-y-2">
              {pageItems.map((item) => {
                const resp = responses[item.num]
                return (
                  <div
                    key={item.num}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                    style={{
                      background:   resp ? 'white' : 'var(--stone-50)',
                      borderColor:  resp ? 'var(--stone-200)' : 'var(--stone-100)',
                    }}
                  >
                    <span className="text-xs font-mono w-5 shrink-0" style={{ color: 'var(--stone-400)' }}>{item.num}</span>
                    <p className="flex-1 text-sm" style={{ color: 'var(--stone-700)' }}>{item.text}</p>
                    <div className="flex gap-2 shrink-0">
                      {(['igual', 'diferente'] as CooperResponse[]).map((val) => (
                        <button
                          key={val}
                          onClick={() => handleResponse(item.num, val)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
                          style={{
                            background:  resp === val ? (val === 'igual' ? 'var(--teal-600)' : 'var(--stone-700)') : 'white',
                            color:       resp === val ? 'white' : 'var(--stone-500)',
                            borderColor: resp === val ? 'transparent' : 'var(--stone-200)',
                          }}
                        >
                          {val === 'igual' ? 'Igual que yo' : 'No es como yo'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-sm px-4 py-2 rounded-xl border"
                style={{ color: 'var(--stone-500)', borderColor: 'var(--stone-200)', background: 'white', opacity: page === 0 ? 0.4 : 1 }}
              >
                ← Anterior
              </button>
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: page === i ? '24px' : '8px', background: page === i ? 'var(--teal-500)' : 'var(--stone-300)' }}
                  />
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="text-sm px-4 py-2 rounded-xl border"
                style={{ color: 'var(--stone-500)', borderColor: 'var(--stone-200)', background: 'white', opacity: page === totalPages - 1 ? 0.4 : 1 }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar derecho */}
        <aside className="w-52 border-l p-4 flex flex-col gap-4" style={{ background: 'white', borderColor: 'var(--stone-100)' }}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--stone-400)' }}>Puntaje parcial</div>
            {partial ? (
              <div>
                <div className="text-3xl font-bold" style={{ color: partial.levelColor, fontFamily: 'var(--font-serif)' }}>{partial.totalScaled}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: partial.levelColor }}>{partial.levelLabel}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--stone-400)' }}>{completed}/58 ítems</div>
              </div>
            ) : (
              <div className="text-3xl font-light" style={{ color: 'var(--stone-300)' }}>—</div>
            )}
          </div>

          {partial && partial.lieScaleInvalid && (
            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
              <strong>⚠ Escala de mentira:</strong> {partial.lieScaleRaw}/8. La validez del protocolo puede estar comprometida.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
