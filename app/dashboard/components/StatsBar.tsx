'use client'

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

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'professional': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-2">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-xl md:text-2xl font-semibold text-gray-800">
            {s.value}
          </span>
          <span className="text-xs text-gray-500">
            {s.label}
          </span>
        </div>
      ))}

      <div className="ml-auto">
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize ${getPlanColor(planLabel)}`}>
          Plan {planLabel === 'free' ? 'Gratuito' : planLabel === 'premium' ? 'Premium' : 'Professional'}
        </span>
      </div>
    </div>
  )
}