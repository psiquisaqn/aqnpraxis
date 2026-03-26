import { PatientDetailClient } from './PatientDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientPage({ params }: Props) {
  const { id } = await params
  return (
    <div>
      <div className="flex justify-end px-4 pt-4">
        <a
          href={`/dashboard/paciente/${id}/nueva-sesion-dual`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1" stroke="white" strokeWidth="1.2"/>
            <path d="M5 1v2M11 1v2M3 6h10" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="8" cy="9" r="1" fill="white"/>
          </svg>
          Evaluación dual
        </a>
      </div>
      <PatientDetailClient patientId={id} />
    </div>
  )
}