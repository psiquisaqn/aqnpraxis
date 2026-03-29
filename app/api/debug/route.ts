import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  return NextResponse.json({ ok: true, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL })
}