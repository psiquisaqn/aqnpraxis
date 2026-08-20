// app/dashboard/paciente/[id]/PatientDetailClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PatientCard from '@/app/dashboard/components/PatientCard'  // ← Alias @/ para componentes raíz
import { NewSessionModal } from '../../components/NewSessionModal'
import { ProgramsTab } from '../../components/ProgramsTab'

interface PatientDetailClientProps {
  patient: any
}

export function PatientDetailClient({ patient }: PatientDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'programs' | 'sessions'>('info')
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)

  const handleNewSession = () => {
    setShowNewSessionModal(true)
  }

  const handleEdit = () => {
    alert('Funcionalidad de edición en desarrollo')
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <PatientCard
        patient={patient}
        onNewSession={handleNewSession}
        onEdit={handleEdit}
      />

      {/* Pestañas */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Información
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sesiones
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'programs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Programas
          </button>
        </nav>
      </div>

      {/* Contenido de pestañas */}
      <div className="mt-6">
        {activeTab === 'info' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Datos del paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Nombre:</strong> {patient.full_name}</div>
              <div><strong>RUT:</strong> {patient.rut || 'No registrado'}</div>
              <div><strong>Fecha de nacimiento:</strong> {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-CL') : 'No registrada'}</div>
              <div><strong>Edad:</strong> {patient.age_years > 0 ? `${patient.age_years} años ${patient.age_months} meses` : 'No calculada'}</div>
              <div><strong>Colegio:</strong> {patient.school || 'No registrado'}</div>
              <div><strong>Total de sesiones:</strong> {patient.session_count}</div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Historial de sesiones</h3>
            {patient.sessions.length === 0 ? (
              <p className="text-sm text-gray-400">No hay sesiones registradas.</p>
            ) : (
              <ul className="space-y-2">
                {patient.sessions.map((session: any) => (
                  <li key={session.id} className="flex justify-between items-center border-b border-gray-100 py-2 text-sm">
                    <span>{session.test_id || 'Sin test'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'programs' && (
          <ProgramsTab patientId={patient.id} />
        )}
      </div>

      {/* Modal de nueva sesión */}
      {showNewSessionModal && (
        <NewSessionModal
          patientId={patient.id}
          onClose={() => setShowNewSessionModal(false)}
        />
      )}
    </div>
  )
}