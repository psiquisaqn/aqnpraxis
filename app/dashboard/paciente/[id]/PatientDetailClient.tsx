'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface PatientDetailClientProps {
  patientId: string
}

export function PatientDetailClient({ patientId }: PatientDetailClientProps) {
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadPatient = async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (error) {
        setError('Error al cargar paciente')
      } else {
        setPatient(data)
      }
      setLoading(false)
    }

    loadPatient()
  }, [patientId])

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer.')) {
      return
    }

    setDeleting(true)
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)

    if (error) {
      alert('Error al eliminar paciente')
      setDeleting(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-600">
          Volver al dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{patient.full_name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {patient.rut} · {patient.birth_date && new Date(patient.birth_date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar paciente'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Información de contacto</h3>
            <p className="mt-1 text-gray-700">{patient.email || 'No registrado'}</p>
            <p className="text-gray-700">{patient.phone || 'No registrado'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Establecimiento</h3>
            <p className="mt-1 text-gray-700">{patient.school || 'No registrado'}</p>
            <p className="text-gray-700">{patient.grade || 'No registrado'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Notas adicionales</h3>
            <p className="mt-1 text-gray-700">{patient.notes || 'Sin notas'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}