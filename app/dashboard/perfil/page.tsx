'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function ProfilePage() {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
      const { data, error } = await supabase.rpc('get_plan_status', { p_user_id: user.id })
      if (data) setPlan(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isAdmin = plan?.plan === 'admin' || userEmail === 'ajbaeza@u.uchile.cl'

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Plan</h1>
      {plan ? (
        <div className="bg-white rounded-xl p-6 shadow space-y-4 border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">Plan actual</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              plan.is_pro || isAdmin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {isAdmin ? 'Administrador' : plan.is_pro ? 'Premium' : 'Gratuito'}
            </span>
          </div>
          {plan.is_pro && plan.plan_expires_at && (
            <p className="text-sm text-gray-500">
              Vence el {new Date(plan.plan_expires_at).toLocaleDateString()}
            </p>
          )}
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Informes generados</span>
              <span className="font-mono text-gray-800">
                {plan.reports_used} / {plan.reports_limit || '∞'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${plan.reports_limit ? (plan.reports_used / plan.reports_limit) * 100 : 0}%` }}
              />
            </div>
          </div>
          {!plan.is_pro && !isAdmin && (
            <button
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              onClick={() => alert('Funcionalidad de pago próximamente disponible')}
            >
              Actualizar a Premium
            </button>
          )}
          {isAdmin && (
            <p className="text-sm text-gray-500 italic">Acceso de Administrador – sin restricciones</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No se pudo cargar la información del plan.</p>
      )}
      <div className="mt-4">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Volver al dashboard
        </Link>
      </div>
    </div>
  )
}