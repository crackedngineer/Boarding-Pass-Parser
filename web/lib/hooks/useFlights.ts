'use client'

import { useState, useEffect, useCallback } from 'react'
import { listFlights } from '@/lib/api/flight-service'
import type { Flight } from '@/lib/types'

export function useFlights(status?: string) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setFlights(await listFlights(status))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load flights')
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => { refetch() }, [refetch])

  return { flights, isLoading, error, refetch }
}
