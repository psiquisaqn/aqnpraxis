'use client'
// app/register/page.tsx
// FIX #5: El flujo anterior hacía signUp() y luego router.push('/dashboard')
// inmediatamente. Pero Supabase con email confirmation habilitado NO crea
// sesión activa en ese momento — el usuario queda pendiente de confirmar email.
// El DashboardPage (server) llama getUser() → null → "No autenticado".
//
// Solución: detectar si la sesión está activa tras el signup.
// - Si hay sesión (email confirmation deshabilitado): redirigir al dashboard.
// - Si no hay sesión (email confirmation habilitado): mostrar mensaje de éxito
//   pidiendo que revise el email.
//
// El 409 en profiles también se maneja: si el perfil ya existe (conflicto),
// usar upsert en vez de insert.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Crear/actualizar perfil si el usuario existe
    if (data.user) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: fullName,
          email: email,
          plan: 'free',
        },
        { onConflict: 'id' }
      )
    }

    // Verificar si la sesión está activa
    // (email confirmation deshabilitado → session disponible de inmediato)
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // Sesión activa: ir al dashboard directamente
      router.push('/dashboard')
    } else {
      // Sin sesión: confirmación de email requerida
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
          <div className="flex justify-center mb-4">
            <img src="/isotipoaqnpraxis.png" alt="AQN Praxis" className="h-16 w-auto" />
          </div>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 16l7 7 13-13" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-gray-500 mb-2">
            Revisa tu correo electrónico en <span className="font-medium text-gray-800">{email}</span> y haz clic en el enlace de confirmación para activar tu cuenta.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Si no ves el correo, revisa tu carpeta de spam.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors text-center"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/isotipoaqnpraxis.png" alt="AQN Praxis" className="h-16 w-auto" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Crear cuenta</h2>
          <p className="text-sm text-gray-500">Regístrate para comenzar</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="psicologo@ejemplo.cl"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
