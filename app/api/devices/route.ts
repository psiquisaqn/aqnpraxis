import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    console.log('1. Iniciando POST /api/devices')
    
    const supabase = await createClient()
    console.log('2. Supabase cliente creado')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('3. Usuario obtenido:', user?.id, userError)
    
    if (userError) {
      return NextResponse.json({ error: 'Auth error: ' + userError.message }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    console.log('4. Body:', body)
    
    const { device_name, device_type, device_brand } = body

    if (!device_name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const now = new Date().toISOString()
    console.log('5. Insertando dispositivo...')

    const { data, error } = await supabase
      .from('devices')
      .insert({
        user_id: user.id,
        device_name: device_name,
        device_type: device_type || 'laptop',
        device_brand: device_brand || 'desconocido',
        last_seen: now,
        created_at: now
      })
      .select()
      .single()

    console.log('6. Resultado insert:', { data, error })

    if (error) {
      return NextResponse.json({ error: 'DB error: ' + error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Catch error:', err)
    return NextResponse.json({ error: 'Error: ' + (err?.message || 'desconocido') }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error' }, { status: 500 })
  }
}