import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PatientList } from './components/PatientList'
import { StatsBar } from './components/StatsBar'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const headersList = headers()
  const host = headersList.get('host') || ''
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`

  const response = await fetch(`${baseUrl}/api/patients?psychologist_id=${user.id}`, {
    cache: 'no-store',
  })
  
  let patients: any[] = []
  if (response.ok) {
    patients = await response.json()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan')
    .eq('id', user.id)
    .single()

  const { data: sessionsData } = await supabase
    .from('sessions')
    .select('id, status, created_at')
    .eq('psychologist_id', user.id)

  const sessions = sessionsData ?? []
  const activeSessions = sessions.filter((s) => s.status === 'in_progress').length
  const now = new Date()
  const completedThisMonth = sessions.filter((s) => {
    if (s.status !== 'completed') return false
    const d = new Date(s.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const now = new Date()
const hour = now.getHours()
const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

return (
  <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl">
    <div className="mb-6 md:mb-8">
      <h1 className="text-xl md:text-2xl font-medium mb-2 text-gray-900">
        {greeting}, colega{' '}
        <span className="text-blue-600">
          {profile?.full_name?.split(' ')[0] ?? ''}
        </span>
      </h1>
        <StatsBar
          totalPatients={patients.length}
          activeSessions={activeSessions}
          completedThisMonth={completedThisMonth}
          planLabel={profile?.plan ?? 'free'}
        />
      </div>

      <div className="mb-4 md:mb-6 flex items-center gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Pacientes activos
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <PatientList patients={patients} />
    </div>
  )
}