'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionsTab } from '@/app/dashboard/components/SessionsTab'
import { ProgramsTab } from '@/app/dashboard/components/ProgramsTab'
import { EntrevistasTab } from '@/app/dashboard/components/EntrevistasTab'
import PatientCard from '@/app/dashboard/components/PatientCard'
import { EditPatientModal } from '@/app/dashboard/components/EditPatientModal'

interface PatientDetailClientProps {
  patient: any
}

export function PatientDetailClient({ patient }: PatientDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'evaluaciones' | 'programas' | 'entrevistas'>('evaluaciones')
  const [currentPatient, setCurrentPatient] = useState(patient)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const tabs = [
    { id: 'evaluaciones', label: 'Evaluaciones' },
    { id: 'programas', label: 'Programas' },
    { id: 'entrevistas', label: 'Entrevistas' },
  ]

  const handleUpdatePatient = (updatedPatient: any) => {
    setCurrentPatient(updatedPatient)
    // Si quieres refrescar la ruta para que los datos se actualicen en el servidor (opcional)
    // router.refresh()
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Cabecera del paciente - responsive con botón Editar */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <PatientCard
            patient={currentPatient}
            onNewSession={() => {}}
            onEdit={() => setIsEditModalOpen(true)} // ← Botón "Editar" dentro de la tarjeta
          />
        </div>
        {/* Botón Editar externo (por si quieres mantenerlo también) */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="mt-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar paciente
        </button>
      </div>

      {/* Navegación de pestañas */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border border-b-0 border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de pestañas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {activeTab === 'evaluaciones' && <SessionsTab patientId={patient.id} />}
        {activeTab === 'programas' && <ProgramsTab patientId={patient.id} />}
        {activeTab === 'entrevistas' && <EntrevistasTab patientId={patient.id} />}
      </div>

      {/* Modal de edición */}
      <EditPatientModal
        patient={currentPatient}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdatePatient}
      />
    </div>
  )
}