import { supabase } from '@/lib/supabase/client'

export async function getDashboardData() {
  const { data, error } = await supabase.from('dashboard').select('*')

  if (error) {
    return { error: error.message }
  }

  return { data }
}