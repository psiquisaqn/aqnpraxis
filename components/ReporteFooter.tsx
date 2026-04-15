'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

interface ReporteFooterProps {
  showFirma?: boolean
}

export function ReporteFooter({ showFirma = true }: ReporteFooterProps) {
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('config_institucion')
        .select('firma_url')
        .single()
      
      if (data) {
        setFirmaUrl(data.firma_url)
      }
    }
    loadConfig()
  }, [])

  return (
    <div className="mt-8 pt-4" style={{ pageBreakInside: 'avoid' }}>
      {/* Espacio para firma */}
      {showFirma && (
        <div className="text-center mb-6">
          <div className="h-16 flex justify-center items-end">
            {firmaUrl ? (
              <Image src={firmaUrl} alt="Firma" width={150} height={50} className="object-contain" />
            ) : (
              <div className="w-40 border-b border-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Firma profesional</p>
        </div>
      )}

      {/* Isotipo AQN Praxis */}
      <div className="text-center pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <img src="/isotipoaqnpraxis.png" alt="AQN Praxis" className="h-6 w-auto" />
          <span className="text-xs text-gray-400">Desarrollado por AQN Praxis</span>
        </div>
      </div>
    </div>
  )
}