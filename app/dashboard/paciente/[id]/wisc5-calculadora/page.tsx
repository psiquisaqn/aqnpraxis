import { supabase as createSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wisc5CalculadoraClient } from './Wisc5CalculadoraClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Wisc5CalculadoraPage({ params }: Props) {
  const { id: patientId } = await params

  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que el paciente pertenece al psicólogo
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .eq('psychologist_id', user.id)
    .single()

  if (error || !patient) {
    redirect('/dashboard')
  }

  return <Wisc5CalculadoraClient patientId={patientId} />
}