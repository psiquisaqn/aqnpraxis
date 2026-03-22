import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, plan, specialty')
    .eq('id', user.id)
    .single()

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--stone-50)' }}
    >
      {/* Navbar mínima */}
      <nav
        className="border-b px-8 py-4 flex items-center justify-between"
        style={{ background: 'white', borderColor: 'var(--stone-200)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--teal-600)' }}
          >
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="2" fill="white" />
              <path d="M11 6v5.5l3.5 2" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            className="font-semibold"
            style={{ color: 'var(--stone-800)', fontFamily: 'var(--font-sans)' }}
          >
            AQN Praxis
          </span>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="text-sm px-4 py-1.5 rounded-lg border transition-colors"
            style={{
              color: 'var(--stone-600)',
              borderColor: 'var(--stone-200)',
              background: 'white',
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </nav>

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-8 py-14">
        <div className="mb-10">
          <h1
            className="text-3xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--stone-900)' }}
          >
            Hola, {profile?.full_name ?? user.email?.split('@')[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--stone-600)' }}>
            Plan actual:{' '}
            <span
              className="font-medium capitalize"
              style={{ color: 'var(--teal-700)' }}
            >
              {profile?.plan ?? 'free'}
            </span>
          </p>
        </div>

        {/* Cards de módulos — placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'WISC-V Chile', desc: 'Escala de Inteligencia de Wechsler', tag: 'Evaluación' },
            { title: 'PECA', desc: 'Prueba de Evaluación Cognitiva', tag: 'Evaluación' },
            { title: 'BDI-II', desc: 'Inventario de Depresión de Beck', tag: 'Tamizaje' },
            { title: 'Coopersmith', desc: 'Inventario de Autoestima', tag: 'Tamizaje' },
            { title: 'PDPI', desc: 'Programa de intervención — 59 sesiones', tag: 'Intervención' },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-2xl border transition-all duration-200 cursor-default hover:shadow-sm"
              style={{ background: 'white', borderColor: 'var(--stone-200)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="font-semibold"
                  style={{ color: 'var(--stone-800)' }}
                >
                  {item.title}
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--teal-50)',
                    color: 'var(--teal-700)',
                  }}
                >
                  {item.tag}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--stone-600)' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
