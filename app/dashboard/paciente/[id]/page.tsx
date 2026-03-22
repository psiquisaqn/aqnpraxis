import { PatientDetailClient } from './PatientDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientPage({ params }: Props) {
  const { id } = await params
  return <PatientDetailClient patientId={id} />
}
