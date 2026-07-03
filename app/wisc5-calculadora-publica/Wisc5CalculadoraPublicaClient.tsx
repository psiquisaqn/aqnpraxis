'use client'

import { useState, useEffect } from 'react'
import { Wisc5Engine, type RawScores, type ScaledScores } from '@/lib/wisc5/engine'
import Link from 'next/link'

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

export function Wisc5CalculadoraPublicaClient() {
  const engine = new Wisc5Engine()

  // Estados
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().split('T')[0])
  const [ageInfo, setAgeInfo] = useState<{ years: number; months: number; group: string } | null>(null)
  const [rawScores, setRawScores] = useState<RawScores>({})
  const [scaledScores, setScaledScores] = useState<ScaledScores>({})
  const [compositeScores, setCompositeScores] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // ============================================================
  // CÁLCULO DE EDAD
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

  const primarySubtests = SUBTESTS_CONFIG.filter(s => s.primary)
  const secondarySubtests = SUBTESTS_CONFIG.filter(s => !s.primary)

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Calculadora WISC‑V</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ingresa los datos del evaluado y los puntajes brutos. Los resultados se actualizan en tiempo real.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evaluado</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de evaluación</label>
            <input
              type="date"
              value={evalDate}
              onChange={(e) => setEvalDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          {ageInfo && (
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                Edad: <strong>{ageInfo.years} años, {ageInfo.months} meses</strong>
                <span className="ml-2 text-gray-400">| Grupo: {ageInfo.group}</span>
              </span>
            </div>
          )}
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

      {/* Call to Action – Gancho publicitario */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl shadow-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">¿Quieres generar informes completos con rapidez y excelencia?</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Con AQN Praxis puedes administrar evaluaciones psicológicas, generar informes automáticos, guardar historiales y mucho más.
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 bg-white text-blue-700 font-bold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          🚀 Crear cuenta gratuita
        </Link>
        <p className="text-blue-200 text-sm mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-white underline font-medium hover:text-blue-100">
            Inicia sesión
          </Link>
        </p>
      </div>

      <div className="mt-4 text-center text-xs text-gray-400">
        <p>Esta es una versión demostrativa. Los datos no se guardan. Para guardar evaluaciones y generar informes, crea una cuenta.</p>
      </div>
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