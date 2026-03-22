import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({
      error: 'Variables faltantes',
      url:   url ? 'OK' : 'FALTA',
      key:   key ? 'OK' : 'FALTA',
    })
  }

  const db = createClient(url, key)
  const { count, error } = await db
    .from('patients')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    url_prefix:  url.slice(0, 30),
    key_prefix:  key.slice(0, 20),
    count,
    error: error?.message ?? null,
  })
}
