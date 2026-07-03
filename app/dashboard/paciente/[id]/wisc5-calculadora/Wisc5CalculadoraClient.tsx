'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Wisc5Engine, type RawScores, type ScaledScores } from '@/lib/wisc5/engine'
import { getOrCreateDualSessionId } from '@/lib/dual-session'

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
        // 1. Paciente
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single()

        if (patientError || !patientData) {
          setError('No se pudo cargar el paciente.')
          setLoading(false)
          return
        }

        setPatient(patientData)

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
        }

        // 3. Plan
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: plan } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          setPlanStatus(plan)
        }

        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Error al cargar datos.')
        setLoading(false)
      }
    }

    loadData()
  }, [patientId, supabase])

  // ============================================================
  // CÁLCULO EN TIEMPO REAL
  // ============================================================
  useEffect(() => {
    const calculate = async () => {
      if (!patient?.birth_date || !ageInfo) return
      const birth = new Date(patient.birth_date)
      const now = new Date()

      // Calcular escalares
      const newScaled: ScaledScores = {}
      for (const code of Object.keys(rawScores) as (keyof RawScores)[]) {
        const raw = rawScores[code]
        if (raw !== undefined && raw !== null) {
          const scaled = await engine.rawToScaled(ageInfo.group, code, raw)
          if (scaled !== null) {
            newScaled[code] = scaled
          }
        }
      }
      setScaledScores(newScaled)

      // Calcular índices compuestos
      const result = await engine.score(birth, now, rawScores, {})
      if (result) {
        const composites = {
          ICV: result.ICV,
          IVE: result.IVE,
          IRF: result.IRF,
          IMT: result.IMT,
          IVP: result.IVP,
          CIT: result.CIT,
        }
        setCompositeScores(composites)
      }
    }

    calculate()
  }, [rawScores, ageInfo, patient, engine])

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRawChange = (code: string, value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10)
    if (num !== undefined && isNaN(num)) return
    setRawScores(prev => ({ ...prev, [code]: num }))
  }

  const getClassification = (score: number): string => {
    if (score >= 130) return 'Muy superior'
    if (score >= 120) return 'Superior'
    if (score >= 110) return 'Promedio alto'
    if (score >= 90) return 'Promedio'
    if (score >= 80) return 'Promedio bajo'
    if (score >= 70) return 'Limítrofe'
    return 'Extremadamente bajo'
  }

  const getClassificationColor = (score: number): string => {
    if (score >= 130) return 'text-purple-700 bg-purple-50'
    if (score >= 120) return 'text-blue-700 bg-blue-50'
    if (score >= 110) return 'text-green-700 bg-green-50'
    if (score >= 90) return 'text-gray-700 bg-gray-50'
    if (score >= 80) return 'text-yellow-700 bg-yellow-50'
    if (score >= 70) return 'text-orange-700 bg-orange-50'
    return 'text-red-700 bg-red-50'
  }

  // ============================================================
  // GENERAR INFORME
  // ============================================================
  const generateReport = async (type: 'brief' | 'extended') => {
    if (!patient || !ageInfo) return

    // Verificar límite de informes (solo para free)
    const isFree = planStatus?.plan === 'free' || (!planStatus?.is_pro && !planStatus?.is_admin)
    if (isFree && planStatus?.reports_used >= 3) {
      alert('Has alcanzado el límite de 3 informes gratuitos. Actualiza a Premium para más.')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // 1. Obtener o crear una sesión para esta calculadora
      // Buscar una sesión WISC-V en curso o completada reciente para este paciente
      let { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('patient_id', patientId)
        .eq('test_id', 'wisc5')
        .in('status', ['in_progress', 'completed_brief', 'completed_extended'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!session) {
        // Crear una nueva sesión
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert({ patient_id: patientId, test_id: 'wisc5', status: 'in_progress', psychologist_id: user.id })
          .select('id')
          .single()

        if (sessionError) throw new Error('Error al crear sesión')
        session = newSession
      }

      const sessionId = session.id

      // 2. Guardar los puntajes en wisc5_scores
      await supabase
        .from('wisc5_scores')
        .upsert({
          session_id: sessionId,
          raw_scores: rawScores,
          scaled_scores: scaledScores,
          composite_scores: compositeScores,
          status: type === 'brief' ? 'completed_brief' : 'completed_extended',
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })

      // 3. Actualizar el contador de informes usados (si es free)
      if (isFree) {
        await supabase.rpc('increment_reports_used', { p_user_id: user.id })
      }

      // 4. Redirigir a la página de resultados
      router.push(`/resultados/wisc5?session=${sessionId}&type=${type}`)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al generar informe')
    } finally {
      setGenerating(false)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error || 'Paciente no encontrado'}</p>
          <button onClick={() => router.back()} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Volver</button>
        </div>
      </div>
    )
  }

  const primarySubtests = SUBTESTS_CONFIG.filter(s => s.primary)
  const secondarySubtests = SUBTESTS_CONFIG.filter(s => !s.primary)

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Calculadora WISC-V</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paciente: <span className="font-medium text-gray-700">{patient.full_name}</span>
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
        </div>
      </div>

      {/* Formulario en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subpruebas primarias */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Subpruebas primarias</h2>
          <div className="space-y-2">
            {primarySubtests.map(({ code, name }) => (
              <div key={code} className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-48">{name}</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={rawScores[code] ?? ''}
                  onChange={(e) => handleRawChange(code, e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {scaledScores[code] !== undefined && (
                  <span className="text-sm font-medium text-blue-600 w-8 text-center">{scaledScores[code]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subpruebas secundarias */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Subpruebas secundarias</h2>
          <div className="space-y-2">
            {secondarySubtests.map(({ code, name }) => (
              <div key={code} className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-48">{name}</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={rawScores[code] ?? ''}
                  onChange={(e) => handleRawChange(code, e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {scaledScores[code] !== undefined && (
                  <span className="text-sm font-medium text-blue-600 w-8 text-center">{scaledScores[code]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resultados de índices */}
      {compositeScores && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Índices Compuestos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Índice</th>
                  <th className="text-center py-2 px-3">Puntaje</th>
                  <th className="text-center py-2 px-3">Percentil</th>
                  <th className="text-center py-2 px-3">Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'].map((code) => {
                  const idx = compositeScores[code]
                  if (!idx) return null
                  return (
                    <tr key={code} className={`border-b border-gray-100 ${code === 'CIT' ? 'bg-blue-50' : ''}`}>
                      <td className="py-2 px-3 font-medium">{code}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{idx.score}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{idx.percentile}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getClassificationColor(idx.score)}`}>
                          {getClassification(idx.score)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botones de informe y errores */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => generateReport('brief')}
          disabled={generating || !compositeScores}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {generating ? 'Generando...' : 'Generar informe breve (7 subpruebas)'}
        </button>
        <button
          onClick={() => generateReport('extended')}
          disabled={generating || !compositeScores}
          className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {generating ? 'Generando...' : 'Generar informe extendido (15 subpruebas)'}
        </button>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Volver
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}

// ============================================================
// FUNCIÓN AUXILIAR (extraída del engine para evitar dependencia circular)
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