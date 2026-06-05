'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DualTestWrapper } from './DualTestWrapper'
import { Wisc5Engine, type RawScores, type ScaledScores } from '@/lib/wisc5/engine'
import { CCInterface } from './wisc5/CC'
import { ANInterface } from './wisc5/AN'
import { MRInterface } from './wisc5/MR'
import { RDInterface } from './wisc5/RD'
import { CLAInterface } from './wisc5/CLA'
import { VOCInterface } from './wisc5/VOC'
import { BALInterface } from './wisc5/BAL'
import { RVInterface } from './wisc5/RV'
import { RIInterface } from './wisc5/RI'
import { BSInterface } from './wisc5/BS'
import { INInterface } from './wisc5/IN'
import { SLNInterface } from './wisc5/SLN'
import { CANInterface } from './wisc5/CAN'
import { COMInterface } from './wisc5/COM'
import { ARIInterface } from './wisc5/ARI'

// ============================================================
// CONFIGURACIÓN DE SUBPRUEBAS WISC-V
// ============================================================

const WISC_SUBTESTS = [
  { code: 'CC', name: 'Construcción con Cubos', primary: true, order: 1, canBeReplaced: true, replaceWith: 'RV', hasInterface: true },
  { code: 'AN', name: 'Analogías', primary: true, order: 2, canBeReplaced: false, hasInterface: true },
  { code: 'MR', name: 'Matrices de Razonamiento', primary: true, order: 3, canBeReplaced: false, hasInterface: true },
  { code: 'RD', name: 'Retención de Dígitos', primary: true, order: 4, canBeReplaced: false, hasInterface: true },
  { code: 'CLA', name: 'Claves', primary: true, order: 5, canBeReplaced: false, hasInterface: true },
  { code: 'VOC', name: 'Vocabulario', primary: true, order: 6, canBeReplaced: false, hasInterface: true },
  { code: 'BAL', name: 'Balanzas', primary: true, order: 7, canBeReplaced: false, hasInterface: true },
  { code: 'RV', name: 'Rompecabezas Visuales', primary: false, order: 8, canBeReplaced: false, hasInterface: true },
  { code: 'RI', name: 'Retención de Imágenes', primary: false, order: 9, canBeReplaced: false, hasInterface: true },
  { code: 'BS', name: 'Búsqueda de Símbolos', primary: false, order: 10, canBeReplaced: false, hasInterface: true },
  { code: 'IN', name: 'Información', primary: false, order: 11, canBeReplaced: false, hasInterface: true },
  { code: 'SLN', name: 'Secuenciación de Letras y Números', primary: false, order: 12, canBeReplaced: false, hasInterface: true },
  { code: 'CAN', name: 'Cancelación', primary: false, order: 13, canBeReplaced: false, hasInterface: true },
  { code: 'COM', name: 'Comprensión', primary: false, order: 14, canBeReplaced: false, hasInterface: true },
  { code: 'ARI', name: 'Aritmética', primary: false, order: 15, canBeReplaced: false, hasInterface: true }
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
  subtestStatus: Record<string, 'pending' | 'completed' | 'not_administered' | 'pending_review' | 'interrupted'>
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
      
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={substitutionUsed} onChange={(e) => onToggleSubstitution(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span>Reemplazar Construcción con Cubos por Rompecabezas Visuales</span>
        </label>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Subpruebas primarias (7)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {primarySubtests.map(subtest => {
            const effectiveCode = (subtest.code === 'CC' && substitutionUsed) ? 'RV' : subtest.code
            const status = subtestStatus[effectiveCode] || subtestStatus[subtest.code] || 'pending'
            const isCompleted = status === 'completed'
            const isPendingReview = status === 'pending_review'
            const isInterrupted = status === 'interrupted'
            const isNotAdministered = status === 'not_administered'
            return (
              <button key={subtest.code} onClick={() => onSelectSubtest(subtest.code)} disabled={isCompleted}
                className={`p-2 rounded-lg text-left text-sm transition-all ${
                  isCompleted ? 'bg-green-100 text-green-700 border border-green-300 cursor-default' :
                  isPendingReview ? 'bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200' :
                  isInterrupted ? 'bg-purple-100 text-purple-700 border border-purple-300 cursor-pointer hover:bg-purple-200' :
                  isNotAdministered ? 'bg-gray-100 text-gray-400 line-through' :
                  'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                }`}>
                <div className="font-medium">{subtest.name}</div>
                <div className="text-xs">
                  {isCompleted ? '✓ Completada' : 
                   isPendingReview ? '⏳ Pendiente revisión' : 
                   isInterrupted ? '⏸ Interrumpida' :
                   isNotAdministered ? 'No administrada' : 'Pendiente'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Subpruebas secundarias (8)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {secondarySubtests.map(subtest => {
            const status = subtestStatus[subtest.code] || 'pending'
            const isCompleted = status === 'completed'
            const isPendingReview = status === 'pending_review'
            const isInterrupted = status === 'interrupted'
            const isNotAdministered = status === 'not_administered'
            return (
              <button key={subtest.code} onClick={() => onSelectSubtest(subtest.code)} disabled={isCompleted}
                className={`p-2 rounded-lg text-left text-sm transition-all ${
                  isCompleted ? 'bg-green-100 text-green-700 border border-green-300 cursor-default' :
                  isPendingReview ? 'bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200' :
                  isInterrupted ? 'bg-purple-100 text-purple-700 border border-purple-300 cursor-pointer hover:bg-purple-200' :
                  isNotAdministered ? 'bg-gray-100 text-gray-400 line-through' :
                  'bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer border border-gray-200'
                }`}>
                <div className="font-medium">{subtest.name}</div>
                <div className="text-xs">
                  {isCompleted ? '✓ Completada' : 
                   isPendingReview ? '⏳ Pendiente revisión' : 
                   isInterrupted ? '⏸ Interrumpida' :
                   isNotAdministered ? 'No administrada' : 'Pendiente'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
        <button onClick={onGenerateBriefReport} disabled={!canGenerateBrief}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            canGenerateBrief ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>Generar informe breve (7 subpruebas)</button>
        <button onClick={onGenerateExtendedReport} disabled={!canGenerateExtended}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            canGenerateExtended ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>Generar informe extendido (15 subpruebas)</button>
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
  const [rawScores, setRawScores] = useState<RawScores>({})
  const [scaledScores, setScaledScores] = useState<ScaledScores>({})
  const [subtestStatus, setSubtestStatus] = useState<Record<string, 'pending' | 'completed' | 'not_administered' | 'pending_review' | 'interrupted'>>({})
  const [substitutionUsed, setSubstitutionUsed] = useState(false)
  const [showQuestionZero, setShowQuestionZero] = useState(true)
  const [activeSubtest, setActiveSubtest] = useState<string | null>(null)
  const [showSubtestPanel, setShowSubtestPanel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [engine] = useState(() => new Wisc5Engine())

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const loadSavedState = async () => {
      const { data } = await supabase.from('wisc5_scores')
        .select('status, substitution_used, completed_subtests, raw_scores, scaled_scores, composite_scores, report_type')
        .eq('session_id', sessionId).single()
      if (data) {
        if (data.substitution_used === 'RV') setSubstitutionUsed(true)
        if (data.completed_subtests) setSubtestStatus(data.completed_subtests as any)
        if (data.raw_scores) setRawScores(data.raw_scores)
        if (data.scaled_scores) setScaledScores(data.scaled_scores)
        if (data.status === 'completed_brief' || data.status === 'completed_extended') setShowSubtestPanel(false)
      }
    }
    if (sessionId) loadSavedState()
  }, [sessionId, supabase])

  useEffect(() => {
    if (birthDate && evalDate) {
      const birth = new Date(birthDate); const evalDt = new Date(evalDate)
      if (birth && evalDt && !isNaN(birth.getTime()) && !isNaN(evalDt.getTime())) {
        const { years, months, totalMonths } = calculateAge(birth, evalDt)
        setAgeInfo({ years, months, group: getAgeGroup(totalMonths) })
      }
    }
  }, [birthDate, evalDate])

  const fetchScaledScore = async (code: string, raw: number, ageGroup: string) => {
    const { data } = await supabase.from('wisc5_norms_subtest').select('scaled_score')
      .eq('age_group', ageGroup).eq('subtest_code', code)
      .lte('raw_score_min', raw).gte('raw_score_max', raw).single()
    return data ? (data as any).scaled_score : null
  }

  const saveState = async (status: string, reportType?: string) => {
    await supabase.from('wisc5_scores').upsert({
      session_id: sessionId,
      status,
      substitution_used: substitutionUsed ? 'RV' : null,
      completed_subtests: subtestStatus as any,
      raw_scores: rawScores,
      scaled_scores: scaledScores,
      report_type: reportType || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' })
  }

  const saveCompositeScores = async (composite: any) => {
    await supabase.from('wisc5_scores').update({
      composite_scores: composite,
      updated_at: new Date().toISOString()
    }).eq('session_id', sessionId)
  }

  const calculateAndSaveIndices = async () => {
    if (!ageInfo || !birthDate || !evalDate) return
    const birth = new Date(birthDate)
    const evalDt = new Date(evalDate)
    const result = await engine.score(birth, evalDt, rawScores, { substitution: substitutionUsed ? 'RV' : undefined })
    if (result) {
      const compositeScores = {
        ICV: result.ICV,
        IVE: result.IVE,
        IRF: result.IRF,
        IMT: result.IMT,
        IVP: result.IVP,
        CIT: result.CIT
      }
      await saveCompositeScores(compositeScores)
    }
  }

  const handleSubtestComplete = async (code: string, rawTotal: number) => {
    console.log('✅ Subprueba ' + code + ' completada. Puntaje bruto:', rawTotal)
    
    if (rawTotal === -1) {
      setSubtestStatus(prev => ({ ...prev, [code]: 'pending_review' }))
      await saveState('in_progress')
      setActiveSubtest(null)
      setShowSubtestPanel(true)
      return
    }
    if (rawTotal === -2) {
      setSubtestStatus(prev => ({ ...prev, [code]: 'interrupted' }))
      await saveState('in_progress')
      setActiveSubtest(null)
      setShowSubtestPanel(true)
      return
    }
    
    const newRawScores = { ...rawScores, [code]: rawTotal }
    setRawScores(newRawScores)
    let newScaledScores = { ...scaledScores }
    
    if (ageInfo?.group) {
      const scaled = await fetchScaledScore(code, rawTotal, ageInfo.group)
      if (scaled !== null) {
        newScaledScores = { ...newScaledScores, [code]: scaled }
        setScaledScores(newScaledScores)
      }
    }
    
    setSubtestStatus(prev => ({ ...prev, [code]: 'completed' }))
    await saveState('in_progress')
    
    // Verificar si ya se completaron las 7 primarias (considerando sustitución)
    const primaryCodes = WISC_SUBTESTS.filter(s => s.primary).map(s => s.code)
    const effectivePrimary = substitutionUsed ? primaryCodes.filter(c => c !== 'CC').concat(['RV']) : primaryCodes
    setTimeout(async () => {
      const updatedStatus = { ...subtestStatus, [code]: 'completed' }
      const allPrimaryCompleted = effectivePrimary.every(c => updatedStatus[c] === 'completed')
      if (allPrimaryCompleted) {
        await calculateAndSaveIndices()
      }
    }, 100)
    
    setActiveSubtest(null)
    setShowSubtestPanel(true)
  }

  const handleSelectSubtest = (code: string) => {
    const status = subtestStatus[code] || 'pending'
    if (status === 'completed') { alert('Esta subprueba ya fue completada.'); return }
    
    if (code === 'CC' || (code === 'RV' && substitutionUsed)) setActiveSubtest('CC')
    else setActiveSubtest(code)
    setShowSubtestPanel(false)
  }

  const handleToggleSubstitution = async (useRV: boolean) => {
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
    await saveState('in_progress')
  }

  const arePrimarySubtestsCompleted = () => {
    const primaryCodes = WISC_SUBTESTS.filter(s => s.primary).map(s => s.code)
    const effectivePrimary = substitutionUsed ? primaryCodes.filter(c => c !== 'CC').concat(['RV']) : primaryCodes
    return effectivePrimary.every(code => subtestStatus[code] === 'completed')
  }

  const areAllSubtestsCompleted = () => {
    return WISC_SUBTESTS.every(s => subtestStatus[s.code] === 'completed')
  }

  const generateBriefReport = async () => {
    if (!arePrimarySubtestsCompleted()) {
      alert('Debes completar las 7 subpruebas primarias para ver los resultados.')
      return
    }
    await calculateAndSaveIndices()
    router.push(`/resultados/wisc5?session=${sessionId}&type=brief`)
  }

  const generateExtendedReport = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: planStatus } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
    const isAdmin = planStatus?.role === 'admin'
    const isPro = planStatus?.is_pro
    if (!isPro && !isAdmin) {
      alert('El informe extendido requiere plan Premium.')
      return
    }
    if (!areAllSubtestsCompleted()) {
      alert('Debes completar las 15 subpruebas para ver los resultados extendidos.')
      return
    }
    await calculateAndSaveIndices()
    router.push(`/resultados/wisc5?session=${sessionId}&type=extended`)
  }

  const handleStartTest = () => {
    if (!birthDate) { setError('Por favor, ingresa la fecha de nacimiento del paciente'); return }
    setShowQuestionZero(false); setError(null); setShowSubtestPanel(true)
  }

  if (showQuestionZero) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Evaluación WISC-V</h2>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <label className="block text-left text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={new Date().toISOString().split('T')[0]} />
              {ageInfo && <p className="text-xs text-gray-500 mt-2">Edad: {ageInfo.years} años, {ageInfo.months} meses | Grupo: {ageInfo.group}</p>}
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button onClick={handleStartTest} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">Comenzar evaluación</button>
          </div>
        </div>
      </div>
    )
  }

  const renderSubtest = () => {
    if (!ageInfo) return null
    const props = { onComplete: (s: any, t: number) => handleSubtestComplete(activeSubtest!, t), onUpdatePatient, patientAge: ageInfo.years }
    
    switch (activeSubtest) {
      case 'CC': return <CCInterface {...props} />
      case 'AN': return <ANInterface {...props} />
      case 'MR': return <MRInterface {...props} />
      case 'RD': return <RDInterface {...props} />
      case 'CLA': return <CLAInterface {...props} />
      case 'VOC': return <VOCInterface {...props} />
      case 'BAL': return <BALInterface {...props} />
      case 'RV': return <RVInterface {...props} />
      case 'RI': return <RIInterface {...props} />
      case 'BS': return <BSInterface {...props} />
      case 'IN': return <INInterface {...props} />
      case 'SLN': return <SLNInterface {...props} />
      case 'CAN': return <CANInterface {...props} />
      case 'COM': return <COMInterface {...props} />
      case 'ARI': return <ARIInterface {...props} />
      default: return null
    }
  }

  const wiscItemsList = Array.from({ length: 15 }, (_, i) => ({ num: i + 1 }))

  return (
    <DualTestWrapper 
      title="Evaluación WISC-V - Escala Wechsler" totalItems={15} currentItem={1} 
      completed={Object.keys(rawScores).length} onItemSelect={() => {}} items={wiscItemsList} 
      showQuestionZero={false} onStart={() => {}} hideNavigation={true}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Edad: {ageInfo?.years} años, {ageInfo?.months} meses | Grupo: {ageInfo?.group}</p>
        </div>

        {activeSubtest && renderSubtest()}
        
        {activeSubtest && (
          <div className="mt-2">
            <button
              onClick={() => handleSubtestComplete(activeSubtest, -2)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ← Volver al panel (dejar interrumpida)
            </button>
          </div>
        )}

        {showSubtestPanel && (
          <SubtestPanel 
            subtestStatus={subtestStatus} onSelectSubtest={handleSelectSubtest}
            onToggleSubstitution={handleToggleSubstitution} substitutionUsed={substitutionUsed}
            onGenerateBriefReport={generateBriefReport} onGenerateExtendedReport={generateExtendedReport}
            canGenerateBrief={arePrimarySubtestsCompleted()} canGenerateExtended={areAllSubtestsCompleted()}
          />
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Progreso</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(subtestStatus).map(([code, status]) => (
              <span key={code} className={`text-xs px-2 py-1 rounded-full ${
                status === 'completed' ? 'bg-green-100 text-green-700' : 
                status === 'pending_review' ? 'bg-orange-100 text-orange-700' :
                status === 'interrupted' ? 'bg-purple-100 text-purple-700' :
                status === 'not_administered' ? 'bg-gray-100 text-gray-400' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {code}: {status === 'completed' ? '✓' : status === 'pending_review' ? '⏳' : status === 'interrupted' ? '⏸' : status === 'not_administered' ? '✗' : '○'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </DualTestWrapper>
  )
}