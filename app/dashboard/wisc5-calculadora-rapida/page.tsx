import { supabase as createSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wisc5CalculadoraRapidaClient } from './Wisc5CalculadoraRapidaClient'

export default async function Wisc5CalculadoraRapidaPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <Wisc5CalculadoraRapidaClient />
}