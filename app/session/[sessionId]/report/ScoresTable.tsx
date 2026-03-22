'use client'

import type { ScaledScores, SubtestCode } from '@/lib/wisc5/engine'

interface SubtestRow {
  code: SubtestCode
  label: string
  index: string
  isCIT: boolean
}

const ROWS: SubtestRow[] = [
  { code: 'CC',  label: 'Construcción con Cubos',     index: 'IVE / CIT',  isCIT: true  },
  { code: 'AN',  label: 'Analogías',                  index: 'ICV / CIT',  isCIT: true  },
  { code: 'MR',  label: 'Matrices de Razonamiento',   index: 'IRF / CIT',  isCIT: true  },
  { code: 'RD',  label: 'Retención de Dígitos',       index: 'IMT / CIT',  isCIT: true  },
  { code: 'CLA', label: 'Claves',                     index: 'IVP / CIT',  isCIT: true  },
  { code: 'VOC', label: 'Vocabulario',                index: 'ICV / CIT',  isCIT: true  },
  { code: 'BAL', label: 'Balanzas',                   index: 'IRF / CIT',  isCIT: true  },
  { code: 'RV',  label: 'Rompecabezas Visuales',      index: 'IVE',        isCIT: false },
  { code: 'RI',  label: 'Retención de Imágenes',      index: 'IMT',        isCIT: false },
  { code: 'BS',  label: 'Búsqueda de Símbolos',       index: 'IVP',        isCIT: false },
  { code: 'IN',  label: 'Información',                index: 'ICV',        isCIT: false },
  { code: 'SLN', label: 'Span de Letras y Números',   index: 'IMT',        isCIT: false },
  { code: 'CAN', label: 'Cancelación',                index: 'IVP',        isCIT: false },
  { code: 'COM', label: 'Comprensión',                index: 'ICV',        isCIT: false },
  { code: 'ARI', label: 'Aritmética',                 index: 'IMT',        isCIT: false },
]

function ScaleBar({ value }: { value: number }) {
  const pct = ((value - 1) / 18) * 100
  const color =
    value >= 13 ? '#7c3aed' :
    value >= 10 ? '#0d9488' :
    value >=  8 ? '#b45309' :
    value >=  4 ? '#f97316' : '#ef4444'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-semibold w-5 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

interface Props {
  rawScores: Partial<Record<SubtestCode, number>>
  scaledScores: ScaledScores
}

export function ScoresTable({ rawScores, scaledScores }: Props) {
  const primary   = ROWS.filter((r) => r.isCIT)
  const secondary = ROWS.filter((r) => !r.isCIT && scaledScores[r.code] !== undefined)

  const renderGroup = (rows: SubtestRow[], title: string) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--stone-400)' }}>
        {title}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--stone-100)' }}>
            <th className="text-left py-1.5 pr-3 text-xs font-medium" style={{ color: 'var(--stone-400)', width: '40%' }}>Subprueba</th>
            <th className="text-center py-1.5 px-2 text-xs font-medium" style={{ color: 'var(--stone-400)', width: '8%' }}>PD</th>
            <th className="text-left py-1.5 pl-2 text-xs font-medium" style={{ color: 'var(--stone-400)', width: '45%' }}>PE</th>
            <th className="text-center py-1.5 text-xs font-medium" style={{ color: 'var(--stone-400)', width: '7%' }}>Índice</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const raw    = rawScores[row.code]
            const scaled = scaledScores[row.code]
            return (
              <tr
                key={row.code}
                style={{ borderBottom: '1px solid var(--stone-50)' }}
              >
                <td className="py-2 pr-3">
                  <span className="font-medium" style={{ color: 'var(--stone-700)' }}>
                    {row.label}
                  </span>
                  <span className="text-xs ml-1.5" style={{ color: 'var(--stone-400)' }}>
                    ({row.code})
                  </span>
                </td>
                <td className="text-center py-2 px-2 font-mono text-sm" style={{ color: 'var(--stone-600)' }}>
                  {raw ?? '—'}
                </td>
                <td className="py-2 pl-2">
                  {scaled !== undefined ? (
                    <ScaleBar value={scaled} />
                  ) : (
                    <span style={{ color: 'var(--stone-300)' }}>—</span>
                  )}
                </td>
                <td className="text-center py-2">
                  <span className="text-[10px]" style={{ color: 'var(--stone-400)' }}>
                    {row.index}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      {renderGroup(primary, 'Subpruebas primarias (CIT)')}
      {secondary.length > 0 && renderGroup(secondary, 'Subpruebas complementarias aplicadas')}
    </div>
  )
}
