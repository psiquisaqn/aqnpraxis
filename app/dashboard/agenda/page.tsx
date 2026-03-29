'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AgendaPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    date: '',
    time: '',
  })

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase.from('patients').select('*')
      if (error) console.error(error.message)
      else setPatients(data || [])
    }
    fetchPatients()
  }, [])

  return (
    <div>
      <h2>Agenda</h2>
      {/* renderizar pacientes y formulario */}
    </div>
  )
}