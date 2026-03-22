'use client'

import { useState, useTransition } from 'react'
import { login, register, resetPassword } from '@/app/auth/actions'

type AuthView = 'login' | 'register' | 'reset'

export default function LoginPage() {
  const [view, setView] = useState<AuthView>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      let result: { error?: string; success?: string } | undefined

      if (view === 'login') {
        result = await login(formData) as any
      } else if (view === 'register') {
        result = await register(formData)
      } else {
        result = await resetPassword(formData)
      }

      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  const switchView = (v: AuthView) => {
    setView(v)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--stone-50)' }}>
      {/* Panel izquierdo — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-14 relative overflow-hidden"
        style={{ background: 'var(--stone-900)' }}
      >
        {/* Patrón decorativo */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Círculo de acento */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, var(--teal-500) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, var(--teal-600) 0%, transparent 70%)`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--teal-600)' }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16a7 7 0 110-14 7 7 0 010 14z" fill="white" fillOpacity=".3"/>
                <path d="M11 6v5.5l3.5 2" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="11" cy="11" r="2" fill="white"/>
              </svg>
            </div>
            <div>
              <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
                AQN Praxis
              </span>
            </div>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10">
          <p
            className="text-4xl leading-tight mb-6 text-white animate-fade-up"
            style={{
              fontFamily: 'var(--font-serif)',
              animationDelay: '80ms',
              fontWeight: 500,
            }}
          >
            Evaluación psicológica{' '}
            <em style={{ color: 'var(--teal-500)' }}>rigurosa</em>{' '}
            y eficiente.
          </p>
          <p
            className="text-base leading-relaxed animate-fade-up"
            style={{
              color: 'var(--stone-300)',
              animationDelay: '160ms',
              maxWidth: '380px',
            }}
          >
            Aplica, puntúa y genera informes de WISC-V, PECA, BDI-II y Coopersmith
            desde una sola plataforma diseñada para psicólogos chilenos.
          </p>

          {/* Tests disponibles */}
          <div
            className="mt-10 flex flex-wrap gap-2 animate-fade-up"
            style={{ animationDelay: '240px' }}
          >
            {['WISC-V Chile', 'PECA', 'BDI-II', 'Coopersmith', 'PDPI'].map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-xs rounded-full border font-medium"
                style={{
                  color: 'var(--teal-500)',
                  borderColor: 'rgba(20,184,166,0.3)',
                  background: 'rgba(20,184,166,0.08)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="relative z-10 text-xs animate-fade-up"
          style={{ color: 'var(--stone-600)', animationDelay: '300ms' }}
        >
          Psiquis AQN · Santiago, Chile · 2025–2026
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-14">
        {/* Logo móvil */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--teal-600)' }}
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="2" fill="white"/>
              <path d="M11 6v5.5l3.5 2" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-lg" style={{ color: 'var(--stone-800)' }}>
            AQN Praxis
          </span>
        </div>

        <div className="w-full max-w-md animate-fade-up" style={{ animationDelay: '60ms' }}>
          {/* Encabezado del formulario */}
          <div className="mb-8">
            <h1
              className="text-2xl font-medium mb-2"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--stone-900)' }}
            >
              {view === 'login' && 'Bienvenido de vuelta'}
              {view === 'register' && 'Crear cuenta'}
              {view === 'reset' && 'Recuperar contraseña'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--stone-600)' }}>
              {view === 'login' && 'Ingresa con tu correo y contraseña.'}
              {view === 'register' && 'Completa los datos para comenzar.'}
              {view === 'reset' && 'Te enviaremos un enlace a tu correo.'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <Field label="Nombre completo" name="fullName" type="text" placeholder="Ej. María González" required />
            )}
            <Field label="Correo electrónico" name="email" type="email" placeholder="correo@ejemplo.com" required />
            {view !== 'reset' && (
              <Field
                label={
                  <div className="flex justify-between items-center">
                    <span>Contraseña</span>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchView('reset')}
                        className="text-xs transition-colors"
                        style={{ color: 'var(--teal-600)' }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                }
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            )}
            {view === 'register' && (
              <Field
                label="Confirmar contraseña"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            )}

            {/* Mensajes */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm animate-fade-in"
                style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
              >
                {translateError(error)}
              </div>
            )}
            {success && (
              <div
                className="rounded-lg px-4 py-3 text-sm animate-fade-in"
                style={{ background: 'var(--teal-50)', color: 'var(--teal-700)', border: '1px solid var(--teal-100)' }}
              >
                {success}
              </div>
            )}

            {/* Botón principal */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 text-white"
              style={{
                background: isPending ? 'var(--stone-300)' : 'var(--teal-600)',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  {view === 'login' ? 'Ingresando...' : view === 'register' ? 'Creando cuenta...' : 'Enviando...'}
                </span>
              ) : (
                <>
                  {view === 'login' && 'Ingresar'}
                  {view === 'register' && 'Crear cuenta'}
                  {view === 'reset' && 'Enviar enlace'}
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--stone-200)' }} />
          </div>

          {/* Cambio de vista */}
          <div className="text-center text-sm" style={{ color: 'var(--stone-600)' }}>
            {view === 'login' && (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="font-medium transition-colors"
                  style={{ color: 'var(--teal-700)' }}
                >
                  Regístrate aquí
                </button>
              </>
            )}
            {view === 'register' && (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-medium transition-colors"
                  style={{ color: 'var(--teal-700)' }}
                >
                  Ingresar
                </button>
              </>
            )}
            {view === 'reset' && (
              <button
                type="button"
                onClick={() => switchView('login')}
                className="flex items-center gap-1 mx-auto font-medium transition-colors"
                style={{ color: 'var(--teal-700)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componentes auxiliares ──────────────────────────────────────────

interface FieldProps {
  label: React.ReactNode
  name: string
  type: string
  placeholder?: string
  required?: boolean
  minLength?: number
}

function Field({ label, name, type, placeholder, required, minLength }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--stone-700)' }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full px-4 py-2.5 rounded-xl text-sm border transition-all duration-150"
        style={{
          background: 'white',
          borderColor: 'var(--stone-200)',
          color: 'var(--stone-800)',
        }}
      />
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="6" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function translateError(msg: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Debes confirmar tu correo antes de ingresar.',
    'User already registered': 'Ya existe una cuenta con ese correo.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 8 caracteres.',
    'auth_callback_failed': 'Error en la autenticación. Intenta nuevamente.',
  }
  return map[msg] ?? msg
}
