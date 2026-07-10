'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Wisc5Engine, type RawScores, type ScaledScores, type SubtestCode, getClassification as engineGetClassification } from '@/lib/wisc5/engine'

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
// FUNCIONES AUXILIARES
// ============================================================

const getClassification = engineGetClassification

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
  const [calculatedScores, setCalculatedScores] = useState<{
    scaled: ScaledScores
    composites: any
  } | null>(null)
  const [planStatus, setPlanStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [engineReady, setEngineReady] = useState(false)
  const [calculating, setCalculating] = useState<'brief' | 'extended' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const engineRef = useRef<Wisc5Engine | null>(null)
  if (!engineRef.current) {
    engineRef.current = new Wisc5Engine()
    console.log('🔄 [WISC] Nueva instancia del engine creada.')
  }
  const engine = engineRef.current

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ============================================================
  // CARGA DE NORMAS, DATOS DEL PACIENTE Y PLAN
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 [WISC] Iniciando carga de datos...')

        await engine.loadNorms()
        setEngineReady(true)
        console.log('✅ [WISC] Normas cargadas en memoria.')

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

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: rpcPlanRaw, error: rpcError } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
          console.log('📦 [WISC] RPC get_plan_status (raw):', rpcPlanRaw)
          if (rpcError) console.error('❌ [WISC] Error de RPC:', rpcError)

          const rpcPlan = Array.isArray(rpcPlanRaw) ? rpcPlanRaw[0] : rpcPlanRaw
          if (rpcPlan) {
            setPlanStatus(rpcPlan)
            console.log('✅ [WISC] Plan establecido desde RPC:', rpcPlan)
          } else {
            console.warn('⚠️ [WISC] RPC devolvió null, usando fallback desde profiles.')
            const { data: profile } = await supabase
              .from('profiles')
              .select('plan, role')
              .eq('id', user.id)
              .single()
            const basePlan = profile?.plan || 'free'
            const isPro = basePlan === 'premium' || basePlan === 'pro' || profile?.role === 'admin'
            const { count: reportsCount } = await supabase
              .from('informes')
              .select('*', { count: 'exact', head: true })
              .eq('psychologist_id', user.id)
            const fallbackPlan = {
              plan: basePlan,
              is_pro: isPro,
              reports_used: reportsCount || 0,
              reports_limit: isPro ? 999999 : 3,
              plan_expires_at: null,
              role: profile?.role || null,
            }
            setPlanStatus(fallbackPlan)
            console.log('✅ [WISC] Plan establecido desde fallback:', fallbackPlan)
          }
        } else {
          console.warn('⚠️ [WISC] No hay usuario autenticado.')
        }

        setLoading(false)
        console.log('✅ [WISC] Carga de datos completada.')
      } catch (err) {
        console.error('❌ [WISC] Error en loadData:', err)
        setError('Error al cargar datos.')
        setLoading(false)
        setEngineReady(false)
      }
    }

    loadData()
  }, [patientId, supabase])

  // ============================================================
  // CALCULAR (CUANDO EL USUARIO PRESIONA EL BOTÓN)
  // ============================================================
  const handleCalculate = (type: 'brief' | 'extended') => {
    console.log(`🔍 [WISC] handleCalculate llamado con type=${type}`)
    setValidationError(null)
    setCalculatedScores(null)

    if (!engineReady || !patient?.birth_date || !ageInfo) {
      console.warn('⚠️ [WISC] engineReady:', engineReady, 'patient:', !!patient, 'ageInfo:', !!ageInfo)
      setValidationError('Esperando datos del paciente. Por favor recarga la página.')
      return
    }

    const requiredCodes = type === 'brief'
      ? SUBTESTS_CONFIG.filter(s => s.primary).map(s => s.code)
      : SUBTESTS_CONFIG.map(s => s.code)

    console.log(`📋 [WISC] Subpruebas requeridas (${type}):`, requiredCodes)

    const missing = requiredCodes.filter(code => rawScores[code] === undefined || rawScores[code] === null)
    if (missing.length > 0) {
      const names = missing.map(code => SUBTESTS_CONFIG.find(s => s.code === code)?.name || code)
      const msg = `Faltan subpruebas: ${names.join(', ')}. Completa todos los puntajes para calcular.`
      console.warn('⚠️ [WISC]', msg)
      setValidationError(msg)
      return
    }

    const invalid = requiredCodes.filter(code => isNaN(Number(rawScores[code])))
    if (invalid.length > 0) {
      console.warn('⚠️ [WISC] Puntajes inválidos:', invalid)
      setValidationError('Algunos puntajes no son válidos. Revisa los campos.')
      return
    }

    setCalculating(type)

    try {
      const birth = new Date(patient.birth_date)
      const now = new Date()
      console.log(`📊 [WISC] Calculando para grupo ${ageInfo.group}...`)

      const scaled: ScaledScores = {}
      for (const code of requiredCodes) {
        const raw = rawScores[code]
        if (raw !== undefined && raw !== null) {
          // Forzar el tipo a SubtestCode
          const s = engine.rawToScaled(ageInfo.group, code as SubtestCode, raw)
          if (s !== null) {
            scaled[code as SubtestCode] = s
          } else {
            console.warn(`⚠️ [WISC] No se encontró norma para ${code} (raw=${raw}, group=${ageInfo.group})`)
          }
        }
      }
      console.log('📊 [WISC] Escalares calculados:', scaled)

      const result = engine.score(birth, now, rawScores, {})
      console.log('📊 [WISC] Resultado de engine.score:', result)

      if (result) {
        const composites = {
          ICV: result.ICV,
          IVE: result.IVE,
          IRF: result.IRF,
          IMT: result.IMT,
          IVP: result.IVP,
          CIT: result.CIT,
        }
        console.log('📊 [WISC] Composite scores a setear:', composites)
        setCalculatedScores({ scaled, composites })
        setValidationError(null)
        console.log('✅ [WISC] Cálculo completado exitosamente.')
      } else {
        console.warn('⚠️ [WISC] engine.score devolvió null/undefined.')
        setValidationError('El motor no pudo calcular los índices. Verifica que las normas estén cargadas.')
      }
    } catch (err: any) {
      console.error('❌ [WISC] Error calculando:', err)
      setValidationError(err.message || 'Error al calcular')
    } finally {
      setCalculating(null)
    }
  }

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRawChange = (code: string, value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10)
    if (num !== undefined && isNaN(num)) return
    setRawScores(prev => ({ ...prev, [code]: num }))
    setCalculatedScores(null)
    setValidationError(null)
  }

  // ============================================================
  // GENERAR INFORME
  // ============================================================
  const generateReport = async (type: 'brief' | 'extended') => {
    console.log(`📄 [WISC] generateReport llamado con type=${type}`)

    if (!patient || !ageInfo) {
      setError('Faltan datos del paciente o edad.')
      return
    }

    if (!calculatedScores) {
      setError('Primero debes calcular los puntajes.')
      return
    }

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

      let { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('patient_id', patientId)
        .eq('test_id', 'wisc5')
        .eq('psychologist_id', user.id)
        .in('status', ['in_progress', 'completed_brief', 'completed_extended'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!session) {
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert({
            patient_id: patientId,
            test_id: 'wisc5',
            status: 'in_progress',
            psychologist_id: user.id
          })
          .select('id')
          .single()

        if (createError) {
          console.error('❌ [WISC] Error al crear sesión:', createError)
          throw new Error('Error al crear sesión: ' + createError.message)
        }
        session = newSession
        console.log('✅ [WISC] Nueva sesión creada:', session.id)
      } else {
        console.log('✅ [WISC] Sesión existente encontrada:', session.id)
      }

      const sessionId = session.id

      const payload = {
        session_id: sessionId,
        raw_scores: rawScores,
        scaled_scores: calculatedScores.scaled,
        composite_scores: calculatedScores.composites,
        status: type === 'brief' ? 'completed_brief' : 'completed_extended',
        updated_at: new Date().toISOString()
      }

      const { error: upsertError } = await supabase
        .from('wisc5_scores')
        .upsert(payload, { onConflict: 'session_id' })

      if (upsertError) {
        console.error('❌ [WISC] Error al guardar puntajes:', upsertError)
        throw new Error('Error al guardar puntajes: ' + upsertError.message)
      }
      console.log('✅ [WISC] Puntajes guardados correctamente.')

      const citScore = calculatedScores.composites?.CIT?.score || 0
      const citClassification = getClassification(citScore)

      const { error: informesError } = await supabase
        .from('informes')
        .insert({
          patient_id: patientId,
          psychologist_id: user.id,
          session_id: sessionId,
          test_id: 'wisc5',
          puntaje_total: citScore,
          nivel: citClassification,
          recomendaciones: `Informe WISC-V generado automáticamente. Tipo: ${type === 'brief' ? 'Breve (7 subpruebas)' : 'Extendido (15 subpruebas)'}.`,
          created_at: new Date().toISOString(),
        })

      if (informesError) {
        console.warn('⚠️ [WISC] Error al insertar en informes:', informesError)
      } else {
        console.log('✅ [WISC] Registro insertado en informes.')
      }

      if (isFree) {
        await supabase.rpc('increment_reports_used', { p_user_id: user.id })
      }

      router.push(`/resultados/wisc5?session=${sessionId}&type=${type}`)

    } catch (err: any) {
      console.error('❌ [WISC] Error al generar informe:', err)
      setError(err.message || 'Error al generar informe')
    } finally {
      setGenerating(false)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  console.log(`🖥️ [WISC] Render con calculatedScores:`, calculatedScores?.composites || 'null')

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
          <button onClick={() => router.push('/dashboard')} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  const primarySubtests = SUBTESTS_CONFIG.filter(s => s.primary)
  const secondarySubtests = SUBTESTS_CONFIG.filter(s => !s.primary)
  const composites = calculatedScores?.composites || null
  const hasResults = composites && Object.keys(composites).some(key => composites[key])

  return (
    <div className="max-w-6xl mx-auto p-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {calculatedScores?.scaled[code as SubtestCode] !== undefined && (
                  <span className="text-sm font-medium text-blue-600 w-8 text-center">
                    {calculatedScores.scaled[code as SubtestCode]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

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
                {calculatedScores?.scaled[code as SubtestCode] !== undefined && (
                  <span className="text-sm font-medium text-blue-600 w-8 text-center">
                    {calculatedScores.scaled[code as SubtestCode]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => handleCalculate('brief')}
          disabled={calculating !== null || generating}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calculating === 'brief' ? 'Calculando...' : 'Calcular versión breve (7 subpruebas)'}
        </button>
        <button
          onClick={() => handleCalculate('extended')}
          disabled={calculating !== null || generating}
          className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calculating === 'extended' ? 'Calculando...' : 'Calcular versión extendida (15 subpruebas)'}
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Volver
        </button>
      </div>

      {validationError && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          ⚠️ {validationError}
        </div>
      )}

      {hasResults ? (
        <>
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
                    const idx = composites[code]
                    if (!idx) return null
                    return (
                      <tr key={code} className={`border-b border-gray-100 ${code === 'CIT' ? 'bg-blue-50' : ''}`}>
                        <td className="py-2 px-3 font-medium">{code}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{idx.score}</td>
                        <td className="py-2 px-3 text-center">{idx.percentile}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full">
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

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => generateReport('brief')}
              disabled={generating}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generando...' : 'Generar informe breve (7 subpruebas)'}
            </button>
            <button
              onClick={() => generateReport('extended')}
              disabled={generating}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generando...' : 'Generar informe extendido (15 subpruebas)'}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-5 text-center text-gray-400 text-sm">
          {calculating ? 'Calculando...' : 'Ingresa los puntajes y presiona "Calcular" para ver los resultados.'}
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}