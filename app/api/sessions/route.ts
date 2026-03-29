import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@supabase/supabase-js'

const db = supabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function calcAge(birthDateStr: string) {
  const birth = new Date(birthDateStr)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
  if (months < 0) { years--; months += 12 }
  return { years, months, days }
}

export async function POST(req: NextRequest) {
  const { psychologist_id, patient_id, test_id } = await req.json()

  const { data: patient } = await db.from('patients').select('birth_date').eq('id', patient_id).single()
  const age = patient ? calcAge(patient.birth_date) : { years: 0, months: 0, days: 0 }

  const { data, error } = await db.from('sessions').insert({
    psychologist_id, patient_id, test_id,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    age_years: age.years, age_months: age.months, age_days: age.days,
  }).select('id').single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Error al crear sesión' }, { status: 500 })
  return NextResponse.json({ sessionId: data.id })
}
