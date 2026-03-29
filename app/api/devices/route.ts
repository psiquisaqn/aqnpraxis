import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  console.log('1. Iniciando POST /api/devices')

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 401 })
  }

  console.log('2. Usuario autenticado:', user.id)

  // Aquí tu lógica para registrar/actualizar el dispositivo
  // Ejemplo: insertar un registro en la tabla "devices"
  // const { error: insertError } = await supabase
  //   .from('devices')
  //   .insert({ user_id: user.id, lastseen: new Date().toISOString() })

  // if (insertError) {
  //   return NextResponse.json({ error: insertError.message }, { status: 500 })
  // }

  return NextResponse.json({ success: true })
}