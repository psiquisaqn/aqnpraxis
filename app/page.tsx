'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function HomePage() {
  const [session, setSession] = useState<any>(null)
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <img 
              src="/isotipoaqnpraxis.png" 
              alt="AQN Praxis" 
              className="h-12 w-auto"
            />
            <span className="text-xl font-semibold text-gray-800">AQN Praxis</span>
          </div>
          <div className="flex gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Ir al dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Plataforma de <span className="text-blue-600">Evaluación Psicológica</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Gestión de pacientes, aplicaciones de tests y generación de informes profesionales
          </p>
        </div>

        {/* Botones de acceso rápido */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {/* Botón Sala de Pacientes - siempre visible, sin login */}
          <Link
            href="/sala"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2" stroke="white" strokeWidth="1.5"/>
              <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="white" strokeWidth="1.5"/>
            </svg>
            Sala de Pacientes
          </Link>

          {!session && (
            <>
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Acceso psicólogos
              </Link>
              <Link
                href="/registro"
                className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Crear cuenta profesional
              </Link>
            </>
          )}
        </div>

        {/* Características */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 3.582-8 8-8s8 4 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Gestión de pacientes</h3>
            <p className="text-sm text-gray-500">Administra tu lista de pacientes y su historial clínico</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-600">
                <path d="M4 4h16v16H4zM8 8h8M8 12h6M8 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Tests estandarizados</h3>
            <p className="text-sm text-gray-500">Aplica tests con corrección automática y baremos chilenos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-600">
                <path d="M4 4h16v16H4zM8 8h8M8 12h6M8 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Informes profesionales</h3>
            <p className="text-sm text-gray-500">Genera informes personalizados con logo y firma digital</p>
          </div>
        </div>
      </div>
    </div>
  )
}