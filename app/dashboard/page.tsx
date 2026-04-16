// app/dashboard/page.tsx

import PatientList from '@/app/dashboard/components/PatientList'
import { supabase as createSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Solo los pacientes del psicólogo autenticado
  const { data: patients } = await supabase
    .from('patients')
    .select(`
      *,
      sessions(id, test_id, status, created_at, completed_at)
    `)
    .eq('psychologist_id', user.id)
    .order('created_at', { ascending: false })

  return <PatientList patients={patients ?? []} />
}