'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

type Report = {
  id: string
  name: string
  date: string
}

export default function InformesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc')

  useEffect(() => {
    const loadReports = async () => {
      const { data: sessions, error } = await supabase.from('sessions').select('*')
      if (error) console.error(error.message)
      else setReports(sessions || [])
      setLoading(false)
    }
    loadReports()
  }, [])

  return (
    <div>
      <h2>Informes</h2>
      {loading ? <p>Cargando...</p> : <pre>{JSON.stringify(reports, null, 2)}</pre>}
    </div>
  )
}