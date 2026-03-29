import React from 'react'
import { getDashboardData } from './actions'

export default async function DashboardPage() {
  const { data, error } = await getDashboardData()

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h2>Datos del Dashboard</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}