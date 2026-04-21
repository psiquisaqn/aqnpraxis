'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DualTestWrapper } from './DualTestWrapper'
import { CCInterface } from './wisc5/CC'
import { ANInterface } from './wisc5/AN'
import { MRInterface } from './wisc5/MR'

// ============================================================
// CONFIGURACIÓN DE SUBPRUEBAS WISC-V
// ============================================================

const WISC_SUBTESTS = [
  { code: 'CC', name: 'Construcción con Cubos', primary: true, order: 1, canBeReplaced: true, replaceWith: 'RV', hasInterface: true },
  { code: 'AN', name: 'Analogías', primary: true, order: 2, canBeReplaced: false, hasInterface: true },
  { code: 'MR', name: 'Matrices de Razonamiento', primary: true, order: 3, canBeReplaced: false, hasInterface: true },
  { code: 'RD', name: 'Retención de Dígitos', primary: true, order: 4, canBeReplaced: false, hasInterface: false },
  { code: 'CLA', name: 'Claves', primary: true, order: 5, canBeReplaced: false, hasInterface: false },
  { code: 'VOC', name: 'Vocabulario', primary: true, order: 6, canBeReplaced: false, hasInterface: false },
  { code: 'BAL', name: 'Balanzas', primary: true, order: 7, canBeReplaced: false, hasInterface: false },
  { code: 'RV', name: 'Rompecabezas Visuales', primary: false, order: 8, canBeReplaced: false, hasInterface: false },
  { code: 'RI', name: 'Retención de Imágenes', primary: false, order: 9, canBeReplaced: false, hasInterface: false },
  { code: 'BS', name: 'Búsqueda de Símbolos', primary: false, order: 10, canBeReplaced: false, hasInterface: false },
  { code: 'IN', name: 'Información', primary: false, order: 11, canBeReplaced: false, hasInterface: false },
  { code: 'SLN', name: 'Span Letras y Números', primary: false, order: 12, canBeReplaced: false, hasInterface: false },
  { code: 'CAN', name: 'Cancelación', primary: false, order: 13, canBeReplaced: false, hasInterface: false },
  { code: 'COM', name: 'Comprensión', primary: false, order: 14, canBeReplaced: false, hasInterface: false },
  { code: 'ARI', name: 'Aritmética', primary: false, order: 15, canBeReplaced: false, hasInterface: false }
]

// ============================================================
// FUNCIONES DE APOYO
// ============================================================

const calculateAge = (birthDate: Date, evalDate: Date): { years: number; months: number; totalMonths: number } => {
  let years = evalDate.getFullYear() - birthDate.getFullYear()
  let months = evalDate.getMonth() - birthDate.getMonth()
  let days = evalDate.getDate() - birthDate.getDate()
  if (days < 0) months--
  if (months < 0) { years--; months += 12 }
  return { years, months, totalMonths: years * 12 + months }
}

const getAgeGroup = (totalMonths: number): string => {
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
// PANEL DE SUBPRUEBAS
// ============================================================

interface SubtestPanelProps {
  subtestStatus: Record<string, 'pending' | 'completed' | 'not_administered'>
  onSelectSubtest: (code: string) => void
  onToggleSubstitution: (useRV: boolean) => void
  substitutionUsed: boolean
  onGenerateBriefReport: () => void
  onGenerateExtendedReport: () => void
  canGenerateBrief: boolean
  canGenerateExtended: boolean
}

function SubtestPanel({ 
  subtestStatus, onSelectSubtest, onToggleSubstitution, substitutionUsed,
  onGenerateBriefReport, onGenerateExtendedReport, canGenerateBrief, canGenerateExtended
}: SubtestPanelProps) {
  const primarySubtests = WISC_SUBTESTS.filter(s => s.primary)
  const secondarySubtests = WISC_SUBTESTS.filter(s => !s.primary)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-md font-semibold text-gray-800 mb-3">Subpruebas WISC-V</h3>
      
      {/* Sustitución CC → RV */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={substitutionUsed}
            onChange={(e) => onToggleSubstitution(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Reemplazar Construcción con Cubos por Rompecabezas Visuales</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">Permite omitir CC y usar RV para el cálculo del CIT</p>
      </div>

      {/* Subpruebas primarias */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Subpruebas primarias (7)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {primarySubtests.map(subtest => {
            const effectiveCode = (subtest.code === 'CC' && substitutionUsed) ? 'RV' : subtest.code
            const status = subtestStatus[effectiveCode] || subtestStatus[subtest.code] || 'pending'
            const isCompleted = status === 'completed'
            const isNotAdministered = status === 'not_administered'
            return (
              <button
                key={subtest.code}
                onClick={() => onSelectSubtest(subtest.code)}
                disabled={isCompleted}
                className={`p-2 rounded-lg text-left text-sm transition-all ${
                  isCompleted ? 'bg-green-100 text-green-700 border border-green-300 cursor-default' :
                  isNotAdministered ? 'bg-gray-100 text-gray-400 line-through' :
                  'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                }`}
              >
                <div className="font-medium">{subtest.name}</div>
                <div className="text-xs">
                  {isCompleted ? '✓ Completada' : isNotAdministered ? 'No administrada' : 'Pendiente'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Subpruebas secundarias */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Subpruebas secundarias (8)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {secondarySubtests.map(subtest => {
            const status = subtestStatus[subtest.code] || 'pending'
            const isCompleted = status === 'completed'
            const isNotAdministered = status === 'not_administered'
            return (
              <button
                key={subtest.code}
                onClick={() => onSelectSubtest(subtest.code)}
                disabled={isCompleted}
                className={`p-2 rounded-lg text-left text-sm transition-all ${
                  isCompleted ? 'bg-green-100 text-green-700 border border-green-300 cursor-default' :
                  isNotAdministered ? 'bg-gray-100 text-gray-400 line-through' :
                  'bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer border border-gray-200'
                }`}
              >
                <div className="font-medium">{subtest.name}</div>
                <div className="text-xs">
                  {isCompleted ? '✓ Completada' : isNotAdministered ? 'No administrada' : 'Pendiente'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Botones de generación de informes */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={onGenerateBriefReport}
          disabled={!canGenerateBrief}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            canGenerateBrief ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Generar informe breve (7 subpruebas)
        </button>
        <button
          onClick={onGenerateExtendedReport}
          disabled={!canGenerateExtended}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            canGenerateExtended ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Generar informe extendido (15 subpruebas)
        </button>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL WISC-5 CONTROL
// ============================================================

interface Wisc5ControlProps {
  dualSessionId: string
  sessionId: string
  onUpdatePatient: (content: any) => void
  onSaveResponse: (item: number, value: any) => void
  displayReady?: boolean
}

export function Wisc5Control({ dualSessionId, sessionId, onUpdatePatient, onSaveResponse, displayReady = false }: Wisc5ControlProps) {
  const router = useRouter()
  const [birthDate, setBirthDate] = useState<string>('')
  const [evalDate, setEvalDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [ageInfo, setAgeInfo] = useState<{ years: number; months: number; group: string } | null>(null)
  const [rawScores, setRawScores] = useState<Record<string, number>>({})
  const [scaledScores, setScaledScores] = useState<Record<string, number>>({})
  const [subtestStatus, setSubtestStatus] = useState<Record<string, 'pending' | 'completed' | 'not_administered'>>({})
  const [substitutionUsed, setSubstitutionUsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const [activeSubtest, setActiveSubtest] = useState<string | null>(null)
  const [showSubtestPanel, setShowSubtestPanel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar estado guardado
  useEffect(() => {
    const loadSavedState = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('wisc5_scores')
        .select('status, substitution_used, completed_subtests, report_type')
        .eq('session_id', sessionId)
        .single()
      
      if (data) {
        if (data.substitution_used === 'RV') setSubstitutionUsed(true)
        if (data.completed_subtests) setSubtestStatus(data.completed_subtests)
        if (data.status === 'completed_brief' || data.status === 'completed_extended') {
          setShowSubtestPanel(false)
        }
      }
    }
    if (sessionId) loadSavedState()
  }, [sessionId])

  useEffect(() => {
    if (birthDate && evalDate) {
      const birth = new Date(birthDate)
      const evalDt = new Date(evalDate)
      if (birth && evalDt && !isNaN(birth.getTime()) && !isNaN(evalDt.getTime())) {
        const { years, months, totalMonths } = calculateAge(birth, evalDt)
        const group = getAgeGroup(totalMonths)
        setAgeInfo({ years, months, group })
      }
    }
  }, [birthDate, evalDate])

  const fetchScaledScore = async (subtestCode: string, rawScore: number, ageGroup: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('wisc5_norms_subtest')
      .select('scaled_score')
      .eq('age_group', ageGroup)
      .eq('subtest_code', subtestCode)
      .lte('raw_score_min', rawScore)
      .gte('raw_score_max', rawScore)
      .single()
    if (error || !data) return null
    return (data as any).scaled_score
  }

  const saveState = async (status: string, reportType?: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase
      .from('wisc5_scores')
      .upsert({
        session_id: sessionId,
        status,
        substitution_used: substitutionUsed ? 'RV' : null,
        completed_subtests: subtestStatus,
        report_type: reportType || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' })
  }

  const handleCcComplete = (itemScores: Record<number, number>, rawTotal: number) => {
    const effectiveCode = substitutionUsed ? 'RV' : 'CC'
    console.log('✅ Subprueba CC completada. Puntaje bruto:', rawTotal)
    setRawScores({ ...rawScores, [effectiveCode]: rawTotal })
    setSubtestStatus(prev => ({ ...prev, [effectiveCode]: 'completed' }))
    if (ageInfo?.group) {
      fetchScaledScore(effectiveCode, rawTotal, ageInfo.group).then(scaled => {
        if (scaled) {
          console.log('📊 Puntaje escalado para', effectiveCode, ':', scaled)
          setScaledScores({ ...scaledScores, [effectiveCode]: scaled })
        }
      })
    }
    saveState('in_progress')
    setActiveSubtest(null)
    setShowSubtestPanel(true)
  }

  const handleAnComplete = (itemScores: Record<string | number, number>, rawTotal: number) => {
    console.log('✅ Subprueba AN completada. Puntaje bruto:', rawTotal)
    setRawScores({ ...rawScores, AN: rawTotal })
    setSubtestStatus(prev => ({ ...prev, AN: 'completed' }))
    if (ageInfo?.group) {
      fetchScaledScore('AN', rawTotal, ageInfo.group).then(scaled => {
        if (scaled) {
          console.log('📊 Puntaje escalado para AN:', scaled)
          setScaledScores({ ...scaledScores, AN: scaled })
        }
      })
    }
    saveState('in_progress')
    setActiveSubtest(null)
    setShowSubtestPanel(true)
  }

  const handleMrComplete = (itemScores: Record<string | number, number>, rawTotal: number) => {
    console.log('✅ Subprueba MR completada. Puntaje bruto:', rawTotal)
    setRawScores({ ...rawScores, MR: rawTotal })
    setSubtestStatus(prev => ({ ...prev, MR: 'completed' }))
    if (ageInfo?.group) {
      fetchScaledScore('MR', rawTotal, ageInfo.group).then(scaled => {
        if (scaled) {
          console.log('📊 Puntaje escalado para MR:', scaled)
          setScaledScores({ ...scaledScores, MR: scaled })
        }
      })
    }
    saveState('in_progress')
    setActiveSubtest(null)
    setShowSubtestPanel(true)
  }

  const handleSelectSubtest = (code: string) => {
    console.log('🔘 Subprueba seleccionada:', code)
    if (code === 'CC' || (code === 'RV' && substitutionUsed)) {
      setActiveSubtest('CC')
      setShowSubtestPanel(false)
    } else if (code === 'AN') {
      setActiveSubtest('AN')
      setShowSubtestPanel(false)
    } else if (code === 'MR') {
      setActiveSubtest('MR')
      setShowSubtestPanel(false)
    } else {
      alert(`La subprueba ${code} está en desarrollo. Próximamente disponible.`)
    }
  }

  const handleToggleSubstitution = (useRV: boolean) => {
    console.log('🔄 Sustitución CC → RV:', useRV)
    setSubstitutionUsed(useRV)
    if (useRV && subtestStatus['CC'] === 'completed') {
      if (rawScores.CC) setRawScores({ ...rawScores, RV: rawScores.CC, CC: undefined })
      if (scaledScores.CC) setScaledScores({ ...scaledScores, RV: scaledScores.CC, CC: undefined })
      setSubtestStatus(prev => ({ ...prev, RV: prev.CC, CC: 'not_administered' }))
    } else if (!useRV && subtestStatus['RV'] === 'completed') {
      if (rawScores.RV) setRawScores({ ...rawScores, CC: rawScores.RV, RV: undefined })
      if (scaledScores.RV) setScaledScores({ ...scaledScores, CC: scaledScores.RV, RV: undefined })
      setSubtestStatus(prev => ({ ...prev, CC: prev.RV, RV: 'not_administered' }))
    }
    saveState('in_progress')
  }

  const arePrimarySubtestsCompleted = (): boolean => {
    const primaryCodes = WISC_SUBTESTS.filter(s => s.primary).map(s => s.code)
    const effectivePrimary = substitutionUsed 
      ? primaryCodes.filter(c => c !== 'CC').concat(['RV'])
      : primaryCodes
    return effectivePrimary.every(code => subtestStatus[code] === 'completed')
  }

  const areAllSubtestsCompleted = (): boolean => {
    return WISC_SUBTESTS.every(s => subtestStatus[s.code] === 'completed')
  }

  const generateBriefReport = async () => {
    if (!arePrimarySubtestsCompleted()) return
    console.log('📄 Generando informe breve')
    await saveState('completed_brief', 'brief')
    router.push(`/resultados/wisc5?session=${sessionId}&type=brief`)
  }

  const generateExtendedReport = async () => {
    if (!areAllSubtestsCompleted()) return
    console.log('📄 Generando informe extendido')
    await saveState('completed_extended', 'extended')
    router.push(`/resultados/wisc5?session=${sessionId}&type=extended`)
  }

  const handleStartTest = () => {
    if (!birthDate) { setError('Por favor, ingresa la fecha de nacimiento del paciente'); return }
    console.log('🎯 Iniciando evaluación WISC-V')
    setShowQuestionZero(false)
    setError(null)
    setShowSubtestPanel(true)
  }

  const wiscItemsList = Array.from({ length: 15 }, (_, i) => ({ num: i + 1 }))

  if (showQuestionZero) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Evaluación WISC-V</h2>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm mb-2">Ingresa los datos del paciente para comenzar</p>
              <label className="block text-left text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" max={new Date().toISOString().split('T')[0]} />
              {ageInfo && <p className="text-xs text-gray-500 mt-2">Edad: {ageInfo.years} años, {ageInfo.months} meses | Grupo: {ageInfo.group}</p>}
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button onClick={handleStartTest} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">Comenzar evaluación</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DualTestWrapper title="Evaluación WISC-V - Escala Wechsler" totalItems={15} currentItem={1} completed={Object.keys(rawScores).length} onItemSelect={() => {}} items={wiscItemsList} showQuestionZero={false} onStart={() => {}}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Edad: {ageInfo?.years} años, {ageInfo?.months} meses | Grupo: {ageInfo?.group}</p>
        </div>

        {activeSubtest === 'CC' && ageInfo && (
          <CCInterface onComplete={handleCcComplete} onUpdatePatient={onUpdatePatient} patientAge={ageInfo.years} />
        )}

        {activeSubtest === 'AN' && ageInfo && (
          <ANInterface onComplete={handleAnComplete} onUpdatePatient={onUpdatePatient} patientAge={ageInfo.years} />
        )}

        {activeSubtest === 'MR' && ageInfo && (
          <MRInterface onComplete={handleMrComplete} onUpdatePatient={onUpdatePatient} patientAge={ageInfo.years} />
        )}

        {showSubtestPanel && (
          <SubtestPanel 
            subtestStatus={subtestStatus}
            onSelectSubtest={handleSelectSubtest}
            onToggleSubstitution={handleToggleSubstitution}
            substitutionUsed={substitutionUsed}
            onGenerateBriefReport={generateBriefReport}
            onGenerateExtendedReport={generateExtendedReport}
            canGenerateBrief={arePrimarySubtestsCompleted()}
            canGenerateExtended={areAllSubtestsCompleted()}
          />
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Progreso</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(subtestStatus).map(([code, status]) => (
              <span key={code} className={`text-xs px-2 py-1 rounded-full ${status === 'completed' ? 'bg-green-100 text-green-700' : status === 'not_administered' ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-700'}`}>
                {code}: {status === 'completed' ? '✓' : status === 'not_administered' ? '✗' : '○'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </DualTestWrapper>
  )
}