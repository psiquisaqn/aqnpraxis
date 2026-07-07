import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Filtrar sesiones por psychologist_id
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('psychologist_id', user.id)   // ← FILTRO CLAVE

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}