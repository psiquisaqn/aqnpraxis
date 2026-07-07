'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function ProfilePage() {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
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

  const isAdmin = plan?.plan === 'admin' || plan?.role === 'admin'
  const isPro = plan?.is_pro
  const limit = plan?.reports_limit ?? 3
  const used = plan?.reports_used ?? 0
  const isUnlimited = limit >= 999999

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi Plan</h1>

      {/* Estado actual */}
      <div className="bg-white rounded-xl p-6 shadow border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">Plan actual</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isPro || isAdmin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {isAdmin ? 'Administrador' : isPro ? 'Premium' : 'Gratuito'}
          </span>
        </div>
        {isPro && plan.plan_expires_at && (
          <p className="text-sm text-gray-500 mt-1">
            Vence el {new Date(plan.plan_expires_at).toLocaleDateString()}
          </p>
        )}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-sm">
            <span>Informes generados</span>
            <span className="font-mono">
              {used} / {isUnlimited ? '∞' : limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: isUnlimited ? 100 : (used / limit) * 100 }}
            />
          </div>
        </div>
      </div>

      {/* Planes disponibles (solo si no es admin y no es pro) */}
      {!isPro && !isAdmin && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Actualizar plan</h2>

          {/* Plan Premium */}
          <div className="bg-white rounded-xl p-6 shadow border border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-blue-700">Plan Premium</h3>
                <p className="text-3xl font-bold mt-2">$8.990<span className="text-sm font-normal text-gray-500">/mes</span></p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li>✓ WISC‑V completo (15 subpruebas)</li>
                  <li>✓ Informes ilimitados en PDF, DOCX y ODT</li>
                  <li>✓ Acceso a todos los tests (Coopersmith, BDI‑II, PECA, etc.)</li>
                  <li>✓ Sin límite de informes</li>
                </ul>
              </div>
            </div>
            <button
              className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              onClick={() => alert('El pago con Transbank estará disponible próximamente')}
            >
              Suscribirse con Transbank
            </button>
          </div>

          {/* Bolsa de informes */}
          <div className="bg-white rounded-xl p-6 shadow border border-green-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-green-700">Bolsa de 10 informes</h3>
                <p className="text-3xl font-bold mt-2">$10.990<span className="text-sm font-normal text-gray-500">/único</span></p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li>✓ 10 informes adicionales en PDF, DOCX y ODT</li>
                  <li>✓ Compatible con plan gratuito</li>
                  <li>✓ Sin vencimiento</li>
                </ul>
              </div>
            </div>
            <button
              className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              onClick={() => alert('El pago con Transbank estará disponible próximamente')}
            >
              Comprar con Transbank
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Los pagos se procesarán a través de Transbank. Esta funcionalidad estará habilitada próximamente.
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-purple-700">Acceso de Administrador – sin restricciones.</p>
        </div>
      )}

      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Volver al dashboard
      </Link>
    </div>
  )
}