import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase/server'
import { DashboardShell } from './components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, plan, specialty, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  )
}
