import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}