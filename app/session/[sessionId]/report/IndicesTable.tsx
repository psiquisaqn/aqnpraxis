'use client'

import type { CompositeResult } from '@/lib/wisc5/engine'

interface IndexRow {
  code: string
  label: string
  result?: CompositeResult
}

const CLASSIFICATION_COLOR: Record<string, string> = {
  'Muy superior':     '#5b21b6',
  'Superior':         '#1d4ed8',
  'Promedio alto':    '#0f766e',
  'Promedio':         '#374151',
  'Promedio bajo':    '#92400e',
  'Limítrofe':        '#c2410c',
  'Extremadamente bajo': '#991b1b',
}

interface Props {
  rows: IndexRow[]
}

export function IndicesTable({ rows }: Props) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--stone-200)' }}>
      <table className="w-full text-sm">
        <thead style={{ background: 'var(--stone-50)' }}>
          <tr style={{ borderBottom: '1px solid var(--stone-200)' }}>
            {['Índice', 'Suma PE', 'Puntaje Compuesto', 'Percentil', 'IC 90%', 'Clasificación'].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--stone-500)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ code, label, result }, i) => {
            const isCIT = code === 'CIT'
            const bg = isCIT ? 'var(--stone-50)' : 'white'
            return (
              <tr
                key={code}
                style={{
                  borderBottom: i < rows.length - 1 ? '1px solid var(--stone-100)' : 'none',
                  background: bg,
                  fontWeight: isCIT ? 600 : 400,
                }}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold" style={{ color: 'var(--stone-800)' }}>{code}</div>
                  <div className="text-xs font-normal" style={{ color: 'var(--stone-400)' }}>{label}</div>
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: 'var(--stone-600)' }}>
                  {result?.sumScaled ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {result ? (
                    <span
                      className="text-lg font-bold"
                      style={{ color: CLASSIFICATION_COLOR[result.classification] ?? 'var(--stone-800)' }}
                    >
                      {result.score}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--stone-600)' }}>
                  {result ? `P${result.percentile}` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--stone-600)' }}>
                  {result ? `${result.ci90[0]}–${result.ci90[1]}` : '—'}
                </td>
                <td className="px-4 py-3">
                  {result ? (
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-lg"
                      style={{
                        color: CLASSIFICATION_COLOR[result.classification] ?? 'var(--stone-600)',
                        background: `${CLASSIFICATION_COLOR[result.classification]}15` ?? 'var(--stone-100)',
                      }}
                    >
                      {result.classification}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
