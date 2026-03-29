import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function PUT(req: NextRequest) {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 401 })
  }

  // Aquí puedes añadir la lógica para actualizar el campo "lastseen" en tu tabla de usuarios/dispositivos
  // Ejemplo:
  // await supabase.from('devices').update({ lastseen: new Date().toISOString() }).eq('user_id', user.id)

  return NextResponse.json({ success: true })
}