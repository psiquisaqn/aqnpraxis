import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('🔍 [API] Iniciando petición...')
  
  try {
    // Verificar que las variables de entorno existen
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // ← Usamos anon, no service_role
    
    console.log('🔑 [API] URL:', supabaseUrl ? '✅ existe' : '❌ falta')
    console.log('🔑 [API] Key:', supabaseKey ? '✅ existe' : '❌ falta')

    // Cliente con anon key (RLS está desactivado, así que debería funcionar)
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Obtener datos del body
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

    // Validar
    if (!patient_id || !fecha || !hora) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Insertar directamente (RLS desactivado)
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
      console.error('❌ [API] Error de Supabase:', error)
      return NextResponse.json(
        { error: error.message, details: error },
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