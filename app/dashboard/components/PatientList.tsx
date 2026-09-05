'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Patient {
  id: string
  full_name: string
  rut: string | null
  birth_date: string | null
  school: string | null
}

interface PatientListProps {
  patients: Patient[]
  onPatientClick: (id: string) => void
  onPatientDeleted?: (id: string) => void
  onPatientCreated?: () => void  // Para refrescar la lista después de crear
}

export function PatientList({ 
  patients, 
  onPatientClick, 
  onPatientDeleted,
  onPatientCreated 
}: PatientListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    rut: '',
    birth_date: '',
    school: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ============================================================
  // ELIMINAR PACIENTE
  // ============================================================
  const handleDelete = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar a este paciente? Esto eliminará todas sus sesiones e informes asociados. Esta acción no se puede deshacer.')) {
      return
    }
    setDeletingId(patientId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('psychologist_id', user.id)
      if (error) throw error
      if (onPatientDeleted) {
        onPatientDeleted(patientId)
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      alert('Error al eliminar el paciente: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleWisc5 = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/paciente/${patientId}/wisc5-calculadora`)
  }

  // ============================================================
  // CREAR PACIENTE (modal)
  // ============================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error: insertError } = await supabase
        .from('patients')
        .insert({
          full_name: formData.full_name,
          rut: formData.rut || null,
          birth_date: formData.birth_date || null,
          school: formData.school || null,
          psychologist_id: user.id,
        })

      if (insertError) throw insertError

      // Resetear formulario y cerrar modal
      setFormData({ full_name: '', rut: '', birth_date: '', school: '' })
      setShowModal(false)
      
      // Refrescar lista
      if (onPatientCreated) {
        onPatientCreated()
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear paciente')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  if (patients.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 text-sm mb-4">No hay pacientes registrados.</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Crear primer paciente
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Botón flotante o en header */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nuevo paciente
        </button>
      </div>

      {/* Lista de pacientes */}
      <div className="space-y-3">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-base sm:text-lg truncate">
                {patient.full_name}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-0.5">
                {patient.rut && <span>RUT: {patient.rut}</span>}
                {patient.birth_date && <span>Nac.: {new Date(patient.birth_date).toLocaleDateString('es-CL')}</span>}
                {patient.school && <span className="truncate max-w-[120px] sm:max-w-none">Colegio: {patient.school}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onPatientClick(patient.id) }}
                className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Ver ficha
              </button>
              <button
                onClick={(e) => handleWisc5(patient.id, e)}
                className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                WISC‑V
              </button>
              <button
                onClick={(e) => handleDelete(patient.id, e)}
                disabled={deletingId === patient.id}
                className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === patient.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CREACIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevo paciente</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                  RUT
                </label>
                <input
                  type="text"
                  id="rut"
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  placeholder="Ej: 12.345.678-9"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                  Colegio
                </label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar paciente'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}