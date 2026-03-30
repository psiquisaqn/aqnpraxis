'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  date: string
  time: string
  type: string
  notes: string
  status: 'pending' | 'completed' | 'cancelled'
}

type ViewMode = 'list' | 'week' | 'month'

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showNewForm, setShowNewForm] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  

  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    date: '',
    time: '',
    type: 'Evaluaci├│n',
    notes: ''
  })

  // Cargar citas
  useEffect(() => {
    const loadAppointments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(full_name)
        `)
        .eq('psychologist_id', user.id)
        .order('appointment_date', { ascending: true })

      if (!error && data) {
        const formatted: Appointment[] = data.map((a: any) => ({
          id: a.id,
          patient_id: a.patient_id,
          patient_name: a.patient?.full_name || 'Paciente eliminado',
          date: a.appointment_date,
          time: a.appointment_time,
          type: a.type,
          notes: a.notes,
          status: a.status
        }))
        setAppointments(formatted)
      }

      // Cargar pacientes para el formulario
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('psychologist_id', user.id)

      if (patientsData) setPatients(patientsData)
      setLoading(false)
    }

    loadAppointments()
  }, [])

  const addAppointment = async () => {
    if (!newAppointment.patient_id || !newAppointment.date || !newAppointment.time) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase
      .from('appointments')
      .insert({
        psychologist_id: user.id,
        patient_id: newAppointment.patient_id,
        appointment_date: newAppointment.date,
        appointment_time: newAppointment.time,
        type: newAppointment.type,
        notes: newAppointment.notes,
        status: 'pending'
      })

    if (!error) {
      setShowNewForm(false)
      setNewAppointment({ patient_id: '', date: '', time: '', type: 'Evaluaci├│n', notes: '' })
      // Recargar citas
      window.location.reload()
    } else {
      console.error('Error al guardar:', error)
      alert('Error al guardar la cita')
    }
  }

  const updateStatus = async (id: string, status: 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a))
    }
  }

  // Filtrar citas seg├║n vista
  const getFilteredAppointments = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startOfWeek = new Date(today)
    const day = today.getDay()
    startOfWeek.setDate(today.getDate() - day)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    if (viewMode === 'list') {
      return appointments.filter(a => new Date(a.date) >= today)
    }
    if (viewMode === 'week') {
      return appointments.filter(a => {
        const date = new Date(a.date)
        return date >= startOfWeek && date <= endOfWeek
      })
    }
    return appointments
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Agenda</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            ­ƒôï Lista
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            ­ƒôà Semana
          </button>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <span className="text-lg">+</span>
            Agendar sesi├│n
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            ÔåÉ Volver
          </Link>
        </div>
      </div>

      {/* Formulario nueva cita */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Nueva sesi├│n</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={newAppointment.patient_id}
              onChange={(e) => setNewAppointment({...newAppointment, patient_id: e.target.value})}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">Seleccionar paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
            <input
              type="date"
              value={newAppointment.date}
              onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="time"
              value={newAppointment.time}
              onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            />
            <select
              value={newAppointment.type}
              onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value})}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option>Evaluaci├│n</option>
              <option>Intervenci├│n</option>
              <option>Devoluci├│n</option>
              <option>Seguimiento</option>
            </select>
            <textarea
              placeholder="Notas"
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
              className="px-3 py-2 border border-gray-200 rounded-lg md:col-span-2"
              rows={2}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addAppointment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de citas */}
      {getFilteredAppointments().length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">No hay citas programadas</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Agendar primera sesi├│n
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {getFilteredAppointments().map((apt) => (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-sm transition-shadow">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{apt.patient_name}</div>
                <div className="text-sm text-gray-500">{apt.type}</div>
                <div className="text-xs text-gray-400">{new Date(apt.date).toLocaleDateString()} a las {apt.time}</div>
                {apt.notes && <div className="text-xs text-gray-500 mt-1">{apt.notes}</div>}
              </div>
              <div className="flex gap-2">
                {apt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(apt.id, 'completed')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Completar
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, 'cancelled')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {apt.status === 'completed' && (
                  <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded">Completada</span>
                )}
                {apt.status === 'cancelled' && (
                  <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded">Cancelada</span>
                )}
                <Link
                  href={`/dashboard/paciente/${apt.patient_id}`}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Ver ficha
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
