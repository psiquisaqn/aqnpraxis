import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req, { params }) {
  const { data, error } = await db
    .from("patients")
    .select("*, sessions(id, test_id, status, scheduled_at, started_at, completed_at, age_years, age_months, created_at), activity_sessions(id, program_code, session_number, status, scheduled_date, completed_date, created_at), reports(id, title, pdf_url, is_signed, created_at, version)")
    .eq("id", params.id)
    .eq("psychologist_id", req.nextUrl.searchParams.get("psychologist_id"))
    .single()

  if (error || !data) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  
  return NextResponse.json({
    patient: data,
    sessions: data.sessions ?? [],
    reports: data.reports ?? [],
    activities: data.activity_sessions ?? [],
  })
}

export async function PATCH(req, { params }) {
  const body = await req.json()
  const { psychologist_id, ...data } = body
  const { error } = await db.from("patients").update(data).eq("id", params.id).eq("psychologist_id", psychologist_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
