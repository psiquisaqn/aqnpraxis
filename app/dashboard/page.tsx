import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase/server'
import { PatientList } from './components/PatientList'
import { StatsBar } from './components/StatsBar'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await supabase()
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

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const userName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'psicólogo'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-medium mb-2 text-gray-900">
              {greeting}, colega{' '}
              <span className="text-blue-600">
                {userName}
              </span>
            </h1>
          </div>
          <a
            href="/sala"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2" stroke="white" strokeWidth="1.5"/>
              <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="white" strokeWidth="1.5"/>
            </svg>
            Sala de pacientes
          </a>
        </div>
        <StatsBar
          totalPatients={patients.length}
          activeSessions={activeSessions}
          completedThisMonth={completedThisMonth}
          planLabel={profile?.plan ?? 'free'}
        />
      </div>

      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Pacientes activos
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <PatientList patients={patients} />
    </div>
  )
}