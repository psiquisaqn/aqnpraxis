'use client'

interface Props {
  patientId: string
}

export function ProgramsTab({ patientId }: Props) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Programas</h3>
      <p className="text-sm text-gray-400">Los programas estarán disponibles próximamente.</p>
    </div>
  )
}