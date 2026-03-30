import { supabase as createSupabase } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createSupabase()
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