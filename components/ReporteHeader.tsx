'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

interface ReporteHeaderProps {
  patientName: string
  patientRut?: string
  patientBirthDate?: string
  patientAge?: number
  patientSchool?: string
  evalDate: string
  testName: string
}

export function ReporteHeader({ 
  patientName, 
  patientRut, 
  patientBirthDate, 
  patientAge, 
  patientSchool, 
  evalDate, 
  testName 
}: ReporteHeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [institucionNombre, setInstitucionNombre] = useState('')

  useEffect(() => {
    const loadConfig = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('config_institucion')
        .select('logo_url, institucion_nombre')
        .single()
      
      if (data) {
        setLogoUrl(data.logo_url)
        setInstitucionNombre(data.institucion_nombre || '')
      }
    }
    loadConfig()
  }, [])

  return (
    <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
      <div className="flex justify-between items-start">
        {/* Logo */}
        <div className="w-32 h-20 relative">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo institucional" fill className="object-contain" />
          ) : (
            <div className="w-32 h-20 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
              Logo
            </div>
          )}
        </div>
        
        {/* Título del test */}
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, Times New Roman, serif', color: '#1a1a1a' }}>
            {testName}
          </h1>
        </div>
        
        {/* Espacio reservado */}
        <div className="w-32" />
      </div>

      {/* Datos del paciente */}
      <div className="mt-6 border-t border-b border-gray-300 py-3" style={{ pageBreakInside: 'avoid' }}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><span className="font-semibold">Paciente:</span> {patientName}</div>
          {patientRut && <div><span className="font-semibold">RUT:</span> {patientRut}</div>}
          {patientBirthDate && <div><span className="font-semibold">Fecha nacimiento:</span> {patientBirthDate}</div>}
          {patientAge !== undefined && <div><span className="font-semibold">Edad:</span> {patientAge} años</div>}
          {patientSchool && <div><span className="font-semibold">Colegio/Institución:</span> {patientSchool}</div>}
          <div><span className="font-semibold">Fecha evaluación:</span> {evalDate}</div>
        </div>
      </div>
      
      {institucionNombre && (
        <div className="text-center text-sm text-gray-500 mt-2">
          {institucionNombre}
        </div>
      )}
    </div>
  )
}