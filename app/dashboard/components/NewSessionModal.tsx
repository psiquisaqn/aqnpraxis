'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { getOrCreateSession } from '@/lib/supabase/activities'

interface Props {
  patientId: string | null
  onClose: () => void
}

const TESTS = [
  { id: 'bdi2', label: 'BDI-II - Depresión' },
  { id: 'coopersmith', label: 'Coopersmith SEI - Autoestima' },
  { id: 'peca', label: 'PECA - Conducta Adaptativa' },
  { id: 'entrevista', label: 'Entrevista Psicológica' },
]

const PROGRAMS = [
  { id: 'PDPI', label: 'PDPI - Programa Desarrollo del Pensamiento Inteligente' },
  { id: 'TP-CREM', label: 'TP-CREM - Conexión y Regulación Emocional' },
]

export function NewSessionModal({ patientId, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!patientId) return null

  const handleCreate = async (testId: string) => {
    if (testId === 'entrevista') {
      onClose()
      router.push(`/dashboard/paciente/${patientId}/entrevista/nueva`)
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: session, error: createError } = await supabase
        .from('sessions')
        .insert({
          patient_id: patientId,
          test_id: testId,
          status: 'in_progress',
          psychologist_id: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      const sessionId = session.id

      let dualRedirectId: string
      try {
        const { data: dualSession, error: dualError } = await supabase
          .from('dual_sessions')
          .insert({
            session_id: sessionId,
            test_id: testId,
          })
          .select('id')
          .single()

        if (dualError) {
          console.warn('⚠️ No se pudo crear dual_session, usando session_id como fallback:', dualError)
          dualRedirectId = sessionId
        } else {
          dualRedirectId = dualSession.id
        }
      } catch (err) {
        console.warn('⚠️ Error creando dual_session, usando session_id como fallback:', err)
        dualRedirectId = sessionId
      }

      onClose()
      router.push(`/dual-control/${dualRedirectId}`)
    } catch (err: any) {
      console.error('❌ Error en handleCreate:', err)
      setError(err.message || 'Error al crear sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleProgramClick = async (programId: string) => {
    setLoading(true)
    setError(null)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      await getOrCreateSession(patientId, user.id, programId as any)
      onClose()
      router.push(`/dashboard/paciente/${patientId}/actividades/${programId}`)
    } catch (err: any) {
      console.error('❌ Error al iniciar programa:', err)
      setError(err.message || 'Error al iniciar programa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Nueva sesión</h2>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona el test a aplicar o un programa de intervención:
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-2">Evaluaciones</p>
          {TESTS.map((test) => (
            <button
              key={test.id}
              onClick={() => handleCreate(test.id)}
              disabled={loading}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-gray-800">{test.label}</span>
            </button>
          ))}

          <div className="border-t border-gray-200 my-4" />

          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Programas de intervención</p>
          {PROGRAMS.map((program) => (
            <button
              key={program.id}
              onClick={() => handleProgramClick(program.id)}
              disabled={loading}
              className="w-full text-left px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-blue-800">{program.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}