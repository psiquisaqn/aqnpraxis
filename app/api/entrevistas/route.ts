import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Obtener cookies de la solicitud
    const cookieStore = cookies()

    // 1. Cliente para autenticación (usa las cookies del usuario)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ [API] Error de autenticación:', authError)
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // 2. Cliente con service_role (sin RLS) para insertar
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Obtener datos del body
    const body = await request.json()
    const { 
      patient_id, 
      fecha, 
      hora, 
      asistentes, 
      motivacion_principal, 
      info_relevante, 
      sugerencias_acuerdos 
    } = body

    // Validar campos requeridos
    if (!patient_id || !fecha || !hora) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: patient_id, fecha y hora son obligatorios' },
        { status: 400 }
      )
    }

    console.log('📝 [API] Insertando entrevista:', { patient_id, fecha, hora })

    // Insertar entrevista con el cliente admin (evita problemas de RLS)
    const { data, error } = await supabaseAdmin
      .from('entrevistas')
      .insert({
        patient_id,
        psychologist_id: user.id,
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

    console.log('✅ [API] Entrevista insertada con ID:', data.id)

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    console.error('❌ [API] Error general:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}