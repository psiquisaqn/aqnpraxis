import { supabase } from '@/lib/supabase/client'

export default async function Page({ params }: { params: { dualSessionId: string } }) {
  const { dualSessionId } = params

  // Consulta a Supabase usando el session_id
  const { data, error } = await supabase
    .from('resultados')
    .select('*')
    .eq('session_id', dualSessionId)

  if (error) {
    console.error('Error al traer resultados:', error)
  }

  return (
    <div>
      <h1>Resultados generales</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}