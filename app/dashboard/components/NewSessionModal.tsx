'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Props {
  patientId: string | null
  onClose: () => void
}

const TESTS = [
  { id: 'bdi2', label: 'BDI-II - Depresión' },
  { id: 'coopersmith', label: 'Coopersmith SEI - Autoestima' },
  { id: 'peca', label: 'PECA - Conducta Adaptativa' },
  // WISC-V eliminado
]

export function NewSessionModal({ patientId, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!patientId) return null

  const handleCreate = async (testId: string) => {
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

      onClose()
      // Redirigir a la página del test correspondiente
      const testRoutes: Record<string, string> = {
        bdi2: `/bdi2/${session.id}`,
        coopersmith: `/coopersmith/${session.id}`,
        peca: `/peca/${session.id}`,
      }
      const route = testRoutes[testId]
      if (route) {
        router.push(route)
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Nueva sesión</h2>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona el test a aplicar:
        </p>

        <div className="space-y-2">
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
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}