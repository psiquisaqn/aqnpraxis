'use client'

interface Report {
  id: string
  title: string
  pdf_url?: string
  is_signed: boolean
  created_at: string
  version: number
}

export function ReportsTab({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--stone-100)' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M5 2h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="var(--stone-400)" strokeWidth="1.5"/>
            <path d="M14 2v5h5M8 11h6M8 14h4" stroke="var(--stone-400)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--stone-600)' }}>Sin informes generados</p>
        <p className="text-xs mt-1" style={{ color: 'var(--stone-400)' }}>Los informes se generan al completar una evaluación</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-4 px-4 py-3.5 rounded-xl border"
          style={{ background: 'white', borderColor: 'var(--stone-100)' }}
        >
          {/* Icono */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--stone-100)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="var(--stone-500)" strokeWidth="1.5"/>
              <path d="M11 2v4h4M5 9h8M5 12h5" stroke="var(--stone-500)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--stone-800)' }}>
              {r.title}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--stone-400)' }}>
                {new Date(r.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-xs" style={{ color: 'var(--stone-400)' }}>· v{r.version}</span>
              {r.is_signed && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--teal-700)' }}>
                  Firmado
                </span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 shrink-0">
            {r.pdf_url && (
              <a
                href={r.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                style={{ background: 'var(--teal-600)' }}
              >
                Descargar PDF
              </a>
            )}
            <a
              href={`/informe/${r.id}`}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ color: 'var(--stone-600)', borderColor: 'var(--stone-200)', background: 'white' }}
            >
              Ver
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
