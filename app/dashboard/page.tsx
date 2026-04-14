// app/dashboard/page.tsx
// FIX #7: El DashboardPage server-side ya filtraba por psychologist_id,
// pero PatientList.tsx hace un fetch a /api/patients que NO filtraba — devolvía
// TODOS los pacientes. La corrección es doble:
// 1. DashboardPage pasa el userId al PatientList para que lo use en el fetch
// 2. La API route /api/patients filtra por psychologist_id del usuario autenticado

import { PatientList } from '@/app/dashboard/components/PatientList'
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
