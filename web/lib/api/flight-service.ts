import httpClient from './http-client'
import type { Flight } from '@/lib/types'

export async function listFlights(status?: string): Promise<Flight[]> {
  const q = status ? `?status=${status}` : ''
  const data = await httpClient.get<{ flights: Flight[]; total: number }>(`/flights/${q}`)
  return data.flights
}

export async function getFlight(id: string): Promise<Flight> {
  return httpClient.get<Flight>(`/flights/${id}`)
}
