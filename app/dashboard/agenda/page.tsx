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
  const [currentDate, setCurrentDate] = useState(new Date())
  supabase  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    date: '',
    time: '',
    type: 'Evaluación',
    notes: ''
  })

  // Cargar citas
  useEffect(() => {
    const loadAppointments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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
    if (!user) return

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
      setNewAppointment({ patient_id: '', date: '', time: '', type: 'Evaluación', notes: '' })
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

  // Obtener el primer día de la semana (lunes)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = (day === 0 ? 6 : day - 1)
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Obtener los días de la semana actual
  const getWeekDays = (startDate: Date) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Obtener citas para un día específico
  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(a => a.date === dateStr)
  }

  // Obtener días del mes actual con lunes como primer día
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const startOfWeek = getWeekStart(firstDayOfMonth)
    
    const days = []
    for (let i = 0; i < 42; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatMonthHeader = () => {
    return currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Agenda</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📅 Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📆 Mes
          </button>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <span className="text-lg">+</span>
            Agendar sesión
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </div>

      {/* Formulario nueva cita */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Nueva sesión</h2>
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
              <option>Evaluación</option>
              <option>Intervención</option>
              <option>Devolución</option>
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

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <>
          {appointments.filter(a => new Date(a.date) >= new Date()).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400">No hay citas programadas</p>
              <button
                onClick={() => setShowNewForm(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Agendar primera sesión
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.filter(a => new Date(a.date) >= new Date()).map((apt) => (
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
                      className="inline-flex items-center justify-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Ver ficha
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Vista Semana */}
      {viewMode === 'week' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button onClick={goToPreviousWeek} className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">← Semana anterior</button>
            <span className="text-lg font-medium text-gray-700">
              {formatDateHeader(getWeekStart(currentDate))} - {formatDateHeader(getWeekDays(getWeekStart(currentDate))[6])}
            </span>
            <button onClick={goToNextWeek} className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Semana siguiente →</button>
            <button onClick={goToToday} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">Hoy</button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getWeekDays(getWeekStart(currentDate)).map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day)
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div key={idx} className={`bg-white rounded-xl border p-3 min-h-[200px] ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                    {day.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="space-y-2">
                    {dayAppointments.map(apt => (
                      <div key={apt.id} className="text-xs p-2 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-800">{apt.time} - {apt.patient_name}</div>
                        <div className="text-gray-500">{apt.type}</div>
                        {apt.status === 'pending' && <span className="text-yellow-600 text-[10px]">Pendiente</span>}
                        {apt.status === 'completed' && <span className="text-green-600 text-[10px]">Completada</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vista Mes */}
      {viewMode === 'month' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button onClick={goToPreviousMonth} className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">← Mes anterior</button>
            <span className="text-lg font-medium text-gray-700 capitalize">{formatMonthHeader()}</span>
            <button onClick={goToNextMonth} className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Mes siguiente →</button>
            <button onClick={goToToday} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">Hoy</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
            ))}
            {getMonthDays(currentDate).map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-lg border p-2 min-h-[100px] ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''} ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map(apt => (
                      <div key={apt.id} className="text-[10px] p-1 bg-gray-50 rounded truncate" title={`${apt.time} - ${apt.patient_name}`}>
                        {apt.time} {apt.patient_name.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-[10px] text-gray-400">+{dayAppointments.length - 3} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}