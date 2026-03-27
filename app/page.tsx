import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="text-center">
            {/* Logo e isotipo */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-3">
                <img 
                  src="/isotipoaqnpraxis.png" 
                  alt="AQN Praxis" 
                  className="h-12 w-auto"
                />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">AQN Praxis</span>
              <span className="block text-blue-600 text-2xl md:text-3xl mt-2">
                Evaluación e Intervención Psicológica
              </span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Plataforma integral para psicólogos escolares y clínicos. 
              WISC-V, PECA, BDI-II, Coopersmith y programas de intervención.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg md:px-8"
              >
                Ingresar como psicólogo
              </Link>
              <Link
                href="/sala"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg md:px-8"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Sala de pacientes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}