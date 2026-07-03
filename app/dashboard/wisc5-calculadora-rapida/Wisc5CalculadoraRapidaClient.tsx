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
// FUNCIONES DE CLASIFICACIÓN (CHILENAS)
// ============================================================

function getClassification(score: number): string {
  if (score >= 130) return 'Muy Superior'
  if (score >= 120) return 'Superior'
  if (score >= 110) return 'Normal Alto'
  if (score >= 90) return 'Normal Promedio'
  if (score >= 80) return 'Normal Lento'
  if (score >= 70) return 'Funcionamiento Intelectual Limítrofe'
  return 'Extremadamente Bajo'
}

function getScaledClassification(score: number): string {
  if (score >= 16) return 'Muy Superior'
  if (score >= 14) return 'Superior'
  if (score >= 12) return 'Normal Alto'
  if (score >= 8) return 'Normal Promedio'
  if (score >= 6) return 'Normal Lento'
  if (score >= 4) return 'Funcionamiento Intelectual Limítrofe'
  return 'Extremadamente Bajo'
}

function getClassificationColor(score: number, isScaled: boolean = false): string {
  if (score >= 130 || (isScaled && score >= 16)) return 'text-purple-700 bg-purple-50'
  if (score >= 120 || (isScaled && score >= 14)) return 'text-blue-700 bg-blue-50'
  if (score >= 110 || (isScaled && score >= 12)) return 'text-green-700 bg-green-50'
  if (score >= 90 || (isScaled && score >= 8)) return 'text-gray-700 bg-gray-50'
  if (score >= 80 || (isScaled && score >= 6)) return 'text-yellow-700 bg-yellow-50'
  if (score >= 70 || (isScaled && score >= 4)) return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function Wisc5CalculadoraRapidaClient() {
  const router = useRouter()
  const engine = new Wisc5Engine()

  // Campos del evaluado
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [school, setSchool] = useState('')
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().split('T')[0])

  // Estado de cálculos
  const [ageInfo, setAgeInfo] = useState<{ years: number; months: number; group: string } | null>(null)
  const [rawScores, setRawScores] = useState<RawScores>({})
  const [scaledScores, setScaledScores] = useState<ScaledScores>({})
  const [compositeScores, setCompositeScores] = useState<any>(null)
  const [planStatus, setPlanStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ============================================================
  // CARGAR PLAN DEL USUARIO
  // ============================================================
  useEffect(() => {
    const loadPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: plan } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
        setPlanStatus(plan)
      }
      setLoading(false)
    }
    loadPlan()
  }, [supabase])

  // ============================================================
  // CALCULAR EDAD
  // ============================================================
  useEffect(() => {
    if (birthDate && evalDate) {
      const birth = new Date(birthDate)
      const evalDt = new Date(evalDate)
      if (birth && evalDt && !isNaN(birth.getTime()) && !isNaN(evalDt.getTime())) {
        let years = evalDt.getFullYear() - birth.getFullYear()
        let months = evalDt.getMonth() - birth.getMonth()
        if (months < 0) { years--; months += 12 }
        const totalMonths = years * 12 + months
        const group = getAgeGroup(totalMonths)
        setAgeInfo({ years, months, group })
      }
    }
  }, [birthDate, evalDate])

  // ============================================================
  // CÁLCULO EN TIEMPO REAL
  // ============================================================
  useEffect(() => {
    const calculate = async () => {
      if (!birthDate || !ageInfo) return
      const birth = new Date(birthDate)
      const now = new Date(evalDate)

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
      } else {
        setCompositeScores(null)
      }
    }

    calculate()
  }, [rawScores, ageInfo, birthDate, evalDate, engine])

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRawChange = (code: string, value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10)
    if (num !== undefined && isNaN(num)) return
    setRawScores(prev => ({ ...prev, [code]: num }))
  }

  // ============================================================
  // GENERAR INFORME
  // ============================================================
  const generateReport = async (type: 'brief' | 'extended') => {
    if (!fullName.trim()) {
      setError('Ingresa el nombre del evaluado.')
      return
    }
    if (!birthDate) {
      setError('Ingresa la fecha de nacimiento.')
      return
    }
    if (!ageInfo) {
      setError('Edad no válida. Verifica la fecha de nacimiento.')
      return
    }

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

      // 1. Buscar o crear paciente
      let patientId: string
      const { data: existingPatients } = await supabase
        .from('patients')
        .select('id')
        .eq('full_name', fullName.trim())
        .eq('birth_date', birthDate)
        .eq('psychologist_id', user.id)
        .limit(1)

      if (existingPatients && existingPatients.length > 0) {
        patientId = existingPatients[0].id
        console.log('✅ Paciente existente encontrado:', patientId)
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            full_name: fullName.trim(),
            birth_date: birthDate,
            school: school.trim() || null,
            psychologist_id: user.id
          })
          .select('id')
          .single()

        if (patientError) throw new Error('Error al crear paciente: ' + patientError.message)
        patientId = newPatient.id
        console.log('✅ Nuevo paciente creado:', patientId)
      }

      // 2. Crear sesión
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          patient_id: patientId,
          test_id: 'wisc5',
          status: 'in_progress',
          psychologist_id: user.id
        })
        .select('id')
        .single()

      if (sessionError) throw new Error('Error al crear sesión: ' + sessionError.message)
      const sessionId = session.id
      console.log('✅ Sesión creada:', sessionId)

      // 3. Guardar puntajes
      const payload = {
        session_id: sessionId,
        raw_scores: rawScores,
        scaled_scores: scaledScores,
        composite_scores: compositeScores,
        status: type === 'brief' ? 'completed_brief' : 'completed_extended',
        updated_at: new Date().toISOString()
      }

      const { error: upsertError } = await supabase
        .from('wisc5_scores')
        .upsert(payload, { onConflict: 'session_id' })

      if (upsertError) throw new Error('Error al guardar puntajes: ' + upsertError.message)
      console.log('✅ Puntajes guardados')

      // 4. Incrementar contador de informes (si free)
      if (isFree) {
        await supabase.rpc('increment_reports_used', { p_user_id: user.id })
      }

      // 5. Redirigir
      router.push(`/resultados/wisc5?session=${sessionId}&type=${type}`)

    } catch (err: any) {
      console.error('❌ Error:', err)
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

  const primarySubtests = SUBTESTS_CONFIG.filter(s => s.primary)
  const secondarySubtests = SUBTESTS_CONFIG.filter(s => !s.primary)

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Calculadora WISC-V Rápida</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ingresa los datos del evaluado y los puntajes brutos. Los resultados se actualizan en tiempo real.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Establecimiento</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Colegio, consulta, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span>Fecha evaluación: <strong>{evalDate}</strong></span>
          {ageInfo && (
            <span>
              Edad: <strong>{ageInfo.years} años, {ageInfo.months} meses</strong>
              <span className="ml-2 text-gray-400">| Grupo: {ageInfo.group}</span>
            </span>
          )}
        </div>

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

      {/* Resultados */}
      {compositeScores && Object.keys(compositeScores).some(key => compositeScores[key]) ? (
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
      ) : (
        <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-5 text-center text-gray-400 text-sm">
          Ingresa al menos una subprueba primaria para ver los índices compuestos.
        </div>
      )}

      {/* Botones */}
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
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Volver al dashboard
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
// FUNCIÓN AUXILIAR (extraída del engine)
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