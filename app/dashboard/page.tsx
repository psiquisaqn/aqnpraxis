import { getDashboardData } from './actions'
import { DashboardShell } from '@/app/dashboard/components/DashboardShell'

export default async function DashboardPage() {
  const { data, error } = await getDashboardData()
  if (error) return <div>Error: {error}</div>

  return (
    <DashboardShell profile={data ?? null}>
      <div />
    </DashboardShell>
  )
}