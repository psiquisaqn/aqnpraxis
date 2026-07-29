import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('🔍 [API] Iniciando petición...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await request.json()
    console.log('📝 [API] Body recibido:', body)

    const { 
      patient_id, 
      psychologist_id,
      fecha, 
      hora, 
      asistentes, 
      motivacion_principal, 
      info_relevante, 
      sugerencias_acuerdos 
    } = body

    if (!patient_id || !fecha || !hora || !psychologist_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Insertar y devolver el ID generado
    const { data, error } = await supabase
      .from('entrevistas')
      .insert({
        patient_id,
        psychologist_id,
        fecha,
        hora,
        asistentes: asistentes?.trim() || null,
        motivacion_principal: motivacion_principal?.trim() || null,
        info_relevante: info_relevante?.trim() || null,
        sugerencias_acuerdos: sugerencias_acuerdos?.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('❌ [API] Error al insertar:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Insertado con ID:', data.id)
    return NextResponse.json({ id: data.id }, { status: 201 })

  } catch (error: any) {
    console.error('❌ [API] Error general:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}