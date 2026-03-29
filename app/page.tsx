import { supabase } from '@/lib/supabase/client'

export default async function Page() {
  // Aquí ya puedes usar supabase porque está importado arriba
  const { data, error } = await supabase
    .from('resultados')
    .select('*')

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