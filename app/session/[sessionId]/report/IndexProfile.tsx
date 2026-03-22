'use client'

import type { CompositeResult } from '@/lib/wisc5/engine'

interface IndexData {
  code: string
  label: string
  result?: CompositeResult
}

interface Props {
  indices: IndexData[]
  cit?: CompositeResult
}

const INDEX_COLOR: Record<string, { bar: string; text: string; bg: string }> = {
  ICV: { bar: '#7c3aed', text: '#5b21b6', bg: 'rgba(124,58,237,0.08)' },
  IVE: { bar: '#0369a1', text: '#075985', bg: 'rgba(3,105,161,0.08)' },
  IRF: { bar: '#0d9488', text: '#0f766e', bg: 'rgba(13,148,136,0.08)' },
  IMT: { bar: '#b45309', text: '#92400e', bg: 'rgba(180,83,9,0.08)' },
  IVP: { bar: '#be185d', text: '#9d174d', bg: 'rgba(190,24,93,0.08)' },
  CIT: { bar: '#1c1917', text: '#1c1917', bg: 'rgba(28,25,23,0.06)' },
}

const SCORE_MIN = 40
const SCORE_MAX = 160

function scoreToPercent(score: number) {
  return ((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100
}

function ciToPercent(v: number) {
  return ((v - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100
}

export function IndexProfile({ indices, cit }: Props) {
  const allIndices = [...indices, ...(cit ? [{ code: 'CIT', label: 'CIT', result: cit }] : [])]

  return (
    <div className="space-y-3">
      {/* Escala de referencia */}
      <div className="relative h-5 mb-1">
        <div className="absolute inset-x-0 top-3 h-px" style={{ background: 'var(--stone-200)' }} />
        {[70, 85, 100, 115, 130].map((v) => (
          <div
            key={v}
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${scoreToPercent(v)}%` }}
          >
            <div className="w-px h-2 mb-0.5" style={{ background: 'var(--stone-300)' }} />
            <span className="text-[10px]" style={{ color: 'var(--stone-400)' }}>{v}</span>
          </div>
        ))}
      </div>

      {allIndices.map(({ code, label, result }) => {
        const colors = INDEX_COLOR[code] ?? INDEX_COLOR.CIT
        const isCIT = code === 'CIT'

        if (!result) {
          return (
            <div key={code} className="flex items-center gap-3">
              <span className="w-10 text-xs font-semibold shrink-0" style={{ color: 'var(--stone-400)' }}>{code}</span>
              <div className="flex-1 h-5 rounded-lg" style={{ background: 'var(--stone-100)' }} />
              <span className="w-8 text-xs text-right" style={{ color: 'var(--stone-300)' }}>—</span>
            </div>
          )
        }

        const pct = scoreToPercent(result.score)
        const ci0 = ciToPercent(result.ci90[0])
        const ci1 = ciToPercent(result.ci90[1])

        return (
          <div key={code} className={`flex items-center gap-3 ${isCIT ? 'pt-2 mt-1 border-t' : ''}`} style={isCIT ? { borderColor: 'var(--stone-200)' } : {}}>
            <span
              className="w-10 text-xs font-semibold shrink-0"
              style={{ color: colors.text }}
            >
              {code}
            </span>

            <div className="flex-1 relative h-6 flex items-center">
              {/* Track */}
              <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: 'var(--stone-100)' }} />

              {/* IC90 band */}
              <div
                className="absolute h-3 rounded-sm opacity-30"
                style={{
                  left: `${ci0}%`,
                  width: `${ci1 - ci0}%`,
                  background: colors.bar,
                }}
              />

              {/* Score marker */}
              <div
                className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm -translate-x-1/2 transition-all duration-500"
                style={{
                  left: `${pct}%`,
                  background: colors.bar,
                  boxShadow: `0 0 0 2px ${colors.bar}30`,
                }}
              />
            </div>

            {/* Puntaje */}
            <div className="w-16 text-right shrink-0">
              <span
                className={`text-sm font-bold ${isCIT ? 'text-base' : ''}`}
                style={{ color: colors.text }}
              >
                {result.score}
              </span>
              <span className="text-xs ml-1" style={{ color: 'var(--stone-400)' }}>
                P{result.percentile}
              </span>
            </div>
          </div>
        )
      })}

      {/* Leyenda de bandas */}
      <div className="flex gap-4 pt-2 flex-wrap">
        {[
          { label: 'Muy bajo', range: '<70',    color: '#ef4444' },
          { label: 'Limítrofe', range: '70–79',  color: '#f97316' },
          { label: 'Promedio bajo', range: '80–89', color: '#f59e0b' },
          { label: 'Promedio', range: '90–109', color: '#10b981' },
          { label: 'Superior', range: '110+',   color: '#6366f1' },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
            <span className="text-[10px]" style={{ color: 'var(--stone-500)' }}>{b.label} ({b.range})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
