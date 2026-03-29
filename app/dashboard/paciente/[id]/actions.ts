import { supabase } from '@/lib/supabase/client'

export async function getPacienteData(id: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}