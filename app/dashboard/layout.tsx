import { DashboardShell } from '@/app/dashboard/components/DashboardShell'
import { supabase as createSupabase } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, plan, specialty, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  )
}