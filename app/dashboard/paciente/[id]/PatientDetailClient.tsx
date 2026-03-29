'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface PatientDetailClientProps {
  patientId: string
}

interface Session {
  id: string
  test_id: string
  status: string
  created_at: string
  completed_at: string | null
}

export function PatientDetailClient({ patientId }: PatientDetailClientProps) {
  const [patient, setPatient] = useState<any>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  supabase  const [formData, setFormData] = useState({
    full_name: '',
    rut: '',
    birth_date: '',
    gender: '',
    school: '',
    grade: '',
    email: '',
    phone: '',
    notes: ''
  })

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
        setFormData({
          full_name: data.full_name || '',
          rut: data.rut || '',
          birth_date: data.birth_date || '',
          gender: data.gender || '',
          school: data.school || '',
          grade: data.grade || '',
          email: data.email || '',
          phone: data.phone || '',
          notes: data.notes || ''
        })
        
        // Cargar sesiones del paciente
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
        
        if (!sessionsError && sessionsData) {
          setSessions(sessionsData)
        }
      }
      setLoading(false)
    }

    loadPatient()
  }, [patientId])

  const handleUpdate = async () => {
    setEditing(false)
    const { error } = await supabase
      .from('patients')
      .update(formData)
      .eq('id', patientId)

    if (error) {
      alert('Error al actualizar datos')
    } else {
      setPatient({ ...patient, ...formData })
      alert('Datos actualizados correctamente')
    }
  }

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

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('¿Eliminar esta evaluación?')) return
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
    
    if (error) {
      alert('Error al eliminar evaluación')
    } else {
      setSessions(sessions.filter(s => s.id !== sessionId))
    }
  }

  const getTestName = (testId: string) => {
    const tests: Record<string, string> = {
      coopersmith: 'Coopersmith SEI',
      bdi2: 'BDI-II',
      peca: 'PECA',
      wisc5: 'WISC-V'
    }
    return tests[testId] || testId
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Datos del paciente */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Datos del paciente</h1>
          <div className="flex gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Editar
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar paciente'}
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => setFormData({...formData, rut: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={formData.birth_date?.split('T')[0] || ''}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="NB">No binario</option>
                  <option value="NS">No especifica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Establecimiento</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => setFormData({...formData, school: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Curso/Grado</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-500">Nombre:</span> <span className="text-gray-800">{patient.full_name}</span></div>
            <div><span className="text-sm text-gray-500">RUT:</span> <span className="text-gray-800">{patient.rut || 'No registrado'}</span></div>
            <div><span className="text-sm text-gray-500">Fecha nac.:</span> <span className="text-gray-800">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString() : 'No registrado'}</span></div>
            <div><span className="text-sm text-gray-500">Género:</span> <span className="text-gray-800">{patient.gender || 'No registrado'}</span></div>
            <div><span className="text-sm text-gray-500">Establecimiento:</span> <span className="text-gray-800">{patient.school || 'No registrado'}</span></div>
            <div><span className="text-sm text-gray-500">Curso:</span> <span className="text-gray-800">{patient.grade || 'No registrado'}</span></div>
            <div><span className="text-sm text-gray-500">Email:</span> <span className="text-gray-800">{patient.email || 'No registrado'}</span></div>
            <div><span className="text-sm text-gray-500">Teléfono:</span> <span className="text-gray-800">{patient.phone || 'No registrado'}</span></div>
            <div className="md:col-span-2"><span className="text-sm text-gray-500">Notas:</span> <p className="text-gray-800 mt-1">{patient.notes || 'Sin notas'}</p></div>
          </div>
        )}
      </div>

      {/* Evaluaciones */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Evaluaciones realizadas</h2>
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay evaluaciones registradas</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <div className="font-medium text-gray-800">{getTestName(session.test_id)}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleDateString()}
                    {session.status === 'completed' && ' · Completada'}
                    {session.status === 'in_progress' && ' · En curso'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {session.status === 'completed' && (
                    <Link
                      href={`/resultados/${session.test_id}?session=${session.id}`}
                      className="inline-flex items-center justify-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Ver informe
                    </Link>
                  )}
                  {session.status === 'in_progress' && (
                    <Link
                      href={`/session/${session.id}`}
                      className="inline-flex items-center justify-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Continuar
                    </Link>
                  )}
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="inline-flex items-center justify-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}