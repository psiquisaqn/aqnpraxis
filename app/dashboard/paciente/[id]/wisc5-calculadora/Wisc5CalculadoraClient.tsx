'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Wisc5Engine, type RawScores, type ScaledScores } from '@/lib/wisc5/engine'

// ============================================================
// CONFIGURACIÓN
// ============================================================

const SUBTESTS_CONFIG = [
  { code: 'CC', name: 'Construcción con Cubos', primary: true },
  { code: 'AN', name: 'Analogías', primary: true },
  { code: 'MR', name: 'Matrices de Razonamiento', primary: true },
  { code: 'RD', name: 'Retención de Dígitos', primary: true },
  { code: 'CLA', name: 'Claves', primary: true },
  { code: 'VOC', name: 'Vocabulario', primary: true },
  { code: 'BAL', name: 'Balanzas', primary: true },
  { code: 'RV', name: 'Rompecabezas Visuales', primary: false },
  { code: 'RI', name: 'Retención de Imágenes', primary: false },
  { code: 'BS', name: 'Búsqueda de Símbolos', primary: false },
  { code: 'IN', name: 'Información', primary: false },
  { code: 'SLN', name: 'Secuenciación de Letras y Números', primary: false },
  { code: 'CAN', name: 'Cancelación', primary: false },
  { code: 'COM', name: 'Comprensión', primary: false },
  { code: 'ARI', name: 'Aritmética', primary: false },
]

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface Wisc5CalculadoraClientProps {
  patientId: string
}

export function Wisc5CalculadoraClient({ patientId }: Wisc5CalculadoraClientProps) {
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [ageInfo, setAgeInfo] = useState<{ years: number; months: number; group: string } | null>(null)
  const [rawScores, setRawScores] = useState<RawScores>({})
  const [scaledScores, setScaledScores] = useState<ScaledScores>({})
  const [compositeScores, setCompositeScores] = useState<any>(null)
  const [planStatus, setPlanStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const engine = new Wisc5Engine()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ============================================================
  // CARGA DATOS DEL PACIENTE Y PLAN
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 [WISC] Iniciando carga de datos...')

        // 1. Paciente
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single()

        if (patientError || !patientData) {
          console.error('❌ [WISC] Error cargando paciente:', patientError)
          setError('No se pudo cargar el paciente.')
          setLoading(false)
          return
        }

        setPatient(patientData)
        console.log('✅ [WISC] Paciente cargado:', patientData.full_name)

        // 2. Edad
        const birthDate = patientData.birth_date
        if (birthDate) {
          const birth = new Date(birthDate)
          const now = new Date()
          let years = now.getFullYear() - birth.getFullYear()
          let months = now.getMonth() - birth.getMonth()
          if (months < 0) { years--; months += 12 }
          const totalMonths = years * 12 + months
          const group = getAgeGroup(totalMonths)
          setAgeInfo({ years, months, group })
          console.log('✅ [WISC] Edad calculada:', { years, months, group })
        }

        // 3. Plan - OBTENER DEL PERFIL DIRECTAMENTE Y DE LA RPC
        const { data: { user } } = await supabase.auth.getUser()
        console.log('🔑 [WISC] Usuario autenticado:', user?.id)

        if (user) {
          // Intentar obtener plan desde RPC
          const { data: plan, error: rpcError } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          console.log('📦 [WISC] Datos de RPC get_plan_status:', plan)
          console.log('❌ [WISC] Error de RPC:', rpcError)

          if (plan) {
            setPlanStatus(plan)
            console.log('✅ [WISC] Plan establecido desde RPC:', plan)
          } else {
            // Fallback: obtener directamente de profiles
            console.warn('⚠️ [WISC] RPC devolvió null, intentando fallback desde profiles')
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('plan, role')
              .eq('id', user.id)
              .single()

            if (profile) {
              const fallbackPlan = {
                plan: profile.plan || 'free',
                is_pro: profile.plan === 'premium' || profile.plan === 'pro' || profile.role === 'admin',
                reports_used: 0,
                reports_limit: profile.plan === 'premium' || profile.plan === 'pro' || profile.role === 'admin' ? 999999 : 3,
                plan_expires_at: null,
                role: profile.role || null
              }
              setPlanStatus(fallbackPlan)
              console.log('✅ [WISC] Plan establecido desde fallback:', fallbackPlan)
            } else {
              console.error('❌ [WISC] No se pudo obtener plan desde profiles:', profileError)
              // Plan por defecto (gratuito)
              setPlanStatus({
                plan: 'free',
                is_pro: false,
                reports_used: 0,
                reports_limit: 3,
                plan_expires_at: null,
                role: null
              })
            }
          }
        } else {
          console.warn('⚠️ [WISC] No hay usuario autenticado')
        }

        setLoading(false)
        console.log('✅ [WISC] Carga de datos completada')
      } catch (err) {
        console.error('❌ [WISC] Error en loadData:', err)
        setError('Error al cargar datos.')
        setLoading(false)
      }
    }

    loadData()
  }, [patientId])

  // ... resto del código (los otros useEffect, handlers, generateReport, etc.) ...
  // (Asegúrate de mantener el resto del componente igual, solo se modificó la carga del plan)

  // ============================================================
  // RENDER (solo la parte del plan)
  // ============================================================
  // En el render, donde muestras el plan, agrega un debug visual:
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Calculadora WISC-V</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paciente: <span className="font-medium text-gray-700">{patient?.full_name}</span>
          {ageInfo && (
            <span className="ml-4">
              Edad: {ageInfo.years} años, {ageInfo.months} meses
              <span className="ml-2 text-gray-400">| Grupo: {ageInfo.group}</span>
            </span>
          )}
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Plan: {planStatus?.is_admin ? 'Administrador' : planStatus?.is_pro ? 'Premium' : 'Gratuito'}
          {!planStatus?.is_admin && !planStatus?.is_pro && (
            <span className="ml-2">
              | Informes usados: {planStatus?.reports_used || 0} / 3
            </span>
          )}
          {planStatus?.is_pro && <span className="ml-2">| Informes ilimitados</span>}
          {/* DEBUG: mostrar el objeto planStatus en la interfaz */}
          <div className="mt-1 text-xs text-gray-400">
            DEBUG: planStatus = {JSON.stringify(planStatus)}
          </div>
        </div>
      </div>
      {/* ... resto del render ... */}
    </div>
  )
}

// ============================================================
// FUNCIÓN AUXILIAR
// ============================================================

function getAgeGroup(totalMonths: number): string {
  const groups = [
    { min: 72, max: 77, label: '6:0-6:5' }, { min: 78, max: 83, label: '6:6-6:11' },
    { min: 84, max: 89, label: '7:0-7:5' }, { min: 90, max: 95, label: '7:6-7:11' },
    { min: 96, max: 101, label: '8:0-8:5' }, { min: 102, max: 107, label: '8:6-8:11' },
    { min: 108, max: 113, label: '9:0-9:5' }, { min: 114, max: 119, label: '9:6-9:11' },
    { min: 120, max: 125, label: '10:0-10:5' }, { min: 126, max: 131, label: '10:6-10:11' },
    { min: 132, max: 137, label: '11:0-11:5' }, { min: 138, max: 143, label: '11:6-11:11' },
    { min: 144, max: 149, label: '12:0-12:5' }, { min: 150, max: 155, label: '12:6-12:11' },
    { min: 156, max: 161, label: '13:0-13:5' }, { min: 162, max: 167, label: '13:6-13:11' },
    { min: 168, max: 173, label: '14:0-14:5' }, { min: 174, max: 179, label: '14:6-14:11' },
    { min: 180, max: 185, label: '15:0-15:5' }, { min: 186, max: 191, label: '15:6-15:11' },
    { min: 192, max: 197, label: '16:0-16:5' }, { min: 198, max: 203, label: '16:6-16:11' }
  ]
  const group = groups.find(g => totalMonths >= g.min && totalMonths <= g.max)
  return group?.label || '6:0-6:5'
}