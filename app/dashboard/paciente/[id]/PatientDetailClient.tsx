'use client'

import { useState, useEffect } from 'react'
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

  // Logs de depuración (puedes eliminarlos después)
  useEffect(() => {
    console.log('✅ PatientDetailClient montado con paciente:', patient?.full_name)
  }, [patient])

  useEffect(() => {
    console.log('🔍 isEditModalOpen cambió a:', isEditModalOpen)
  }, [isEditModalOpen])

  const tabs = [
    { id: 'evaluaciones', label: 'Evaluaciones' },
    { id: 'programas', label: 'Programas' },
    { id: 'entrevistas', label: 'Entrevistas' },
  ]

  const handleUpdatePatient = (updatedPatient: any) => {
    console.log('📝 Actualizando paciente:', updatedPatient)
    setCurrentPatient(updatedPatient)
  }

  const handleEditClick = () => {
    console.log('🖱️ Botón Editar clickeado')
    setIsEditModalOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Tarjeta del paciente - con el botón Editar integrado */}
      <div className="mb-6">
        <PatientCard
          patient={currentPatient}
          onNewSession={() => {}}
          onEdit={handleEditClick}  // ← Botón "Editar" dentro de la tarjeta
        />
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