import { supabase } from '@/lib/supabase/client'

export async function getDashboardData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, plan, specialty, avatar_url')
    .eq('id', user.id)
    .single()

  if (error) return { error: error.message }
  return { data }
}