/**
 * GET /api/session/patient?sessionId=xxx
 * Devuelve el patient_id asociado a una sesión.
 * Usado por el hook useReportPdf para completar el meta de reports.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('patient_id')
    .eq('id', sessionId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  return NextResponse.json({ patientId: data.patient_id })
}
