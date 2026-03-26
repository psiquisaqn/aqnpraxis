'use client'

import { useState, useEffect } from 'react'

interface GreetingProps {
  userName: string
}

export function Greeting({ userName }: GreetingProps) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const newGreeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
    setGreeting(newGreeting)
  }, [])

  return (
    <h1 className="text-xl md:text-2xl font-medium mb-2 text-gray-900">
      {greeting}, colega{' '}
      <span className="text-blue-600">
        {userName}
      </span>
    </h1>
  )
}