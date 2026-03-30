'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export function PatientDetailClient({ patientId }: { patientId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    rut: '',
    birth_date: '',
  })

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('patients').delete().eq('id', patientId)
    if (error) setError(error.message)
    else router.push('/dashboard/paciente')
    setDeleting(false)
  }

  return (
    <div>
      <h2>Detalle Paciente</h2>
      {error && <p>Error: {error}</p>}
      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  )
}
export default PatientDetailClient
