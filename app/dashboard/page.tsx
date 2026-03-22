import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPatients } from './actions'
import { PatientList } from './components/PatientList'
import { StatsBar } from './components/StatsBar'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [patients, profileResult, sessionsResult] = await Promise.all([
    getPatients({ archived: false }),
    supabase.from('profiles').select('full_name, plan').eq('id', user.id).single(),
    supabase.from('sessions').select('id, status, created_at').eq('psychologist_id', user.id),
  ])

  const profile = profileResult.data
  const sessions = sessionsResult.data ?? []

  const activeSessions = sessions.filter((s) => s.status === 'in_progress').length
  const now = new Date()
  const completedThisMonth = sessions.filter((s) => {
    if (s.status !== 'completed') return false
    const d = new Date(s.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-medium mb-4"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--stone-900)' }}
        >
          {greeting},{' '}
          <span style={{ color: 'var(--teal-700)' }}>
            {profile?.full_name?.split(' ')[0] ?? 'psicólogo/a'}
          </span>
        </h1>
        <StatsBar
          totalPatients={patients.length}
          activeSessions={activeSessions}
          completedThisMonth={completedThisMonth}
          planLabel={profile?.plan ?? 'free'}
        />
      </div>

      <div className="mb-6 flex items-center gap-4">
        <h2
          className="text-sm font-semibold uppercase tracking-widest shrink-0"
          style={{ color: 'var(--stone-400)' }}
        >
          Pacientes activos
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--stone-200)' }} />
      </div>

      <PatientList patients={patients} />
    </div>
  )
}
