import { notFound } from 'next/navigation'
import { getPatientFull } from './actions'
import { PatientDetailClient } from './PatientDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientPage({ params }: Props) {
  const { id } = await params
  const data = await getPatientFull(id)

  if (!data) notFound()

  return <PatientDetailClient data={data} />
}
