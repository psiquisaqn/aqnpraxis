interface Props {
  totalPatients: number
  activeSessions: number
  completedThisMonth: number
  planLabel: string
}

export function StatsBar({ totalPatients, activeSessions, completedThisMonth, planLabel }: Props) {
  const stats = [
    { label: 'Pacientes activos', value: totalPatients },
    { label: 'Sesiones en curso', value: activeSessions },
    { label: 'Completadas este mes', value: completedThisMonth },
  ]

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline gap-2">
          <span
            className="text-2xl font-semibold"
            style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-serif)' }}
          >
            {s.value}
          </span>
          <span className="text-xs" style={{ color: 'var(--stone-500)' }}>
            {s.label}
          </span>
        </div>
      ))}

      <div className="ml-auto">
        <span
          className="text-xs px-3 py-1.5 rounded-full font-medium capitalize"
          style={{ background: 'var(--teal-50)', color: 'var(--teal-700)', border: '1px solid var(--teal-100)' }}
        >
          Plan {planLabel}
        </span>
      </div>
    </div>
  )
}
