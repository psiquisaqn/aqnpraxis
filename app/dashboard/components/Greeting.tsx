'use client'

import { useState, useEffect } from 'react'

export function Greeting() {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const newGreeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
    setGreeting(newGreeting)
  }, [])

  return (
    <h1 className="text-xl md:text-2xl font-medium mb-2 text-gray-900">
      {greeting}, colega
    </h1>
  )
}