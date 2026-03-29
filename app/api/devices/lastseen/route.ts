import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function PUT(req: NextRequest) {
  const supabase = await supabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const url = new URL(req.url)
  const deviceId = url.searchParams.get('id')

  if (!deviceId) {
    return NextResponse.json({ error: 'ID de dispositivo requerido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', deviceId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}