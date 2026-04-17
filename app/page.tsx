import { redirect } from 'next/navigation'
import { supabase as createSupabase } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}