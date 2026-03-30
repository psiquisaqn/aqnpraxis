import { PatientList } from '@/app/dashboard/components/PatientList'
import { supabase as createSupabase } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>No autenticado</div>

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .eq('psychologist_id', user.id)
    .order('created_at', { ascending: false })

  return <PatientList patients={patients ?? []} />
}