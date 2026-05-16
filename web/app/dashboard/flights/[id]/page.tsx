'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plane } from 'lucide-react'
import { groupFlightsByPnr } from '@/lib/data/mock-flights'
import { useFlights } from '@/lib/hooks'
import { BoardingPassTicket } from '@/components/boarding-pass-ticket'
import { cn } from '@/lib/utils'

export default function FlightDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { flights: allFlights, isLoading } = useFlights()
  const [activeLeg, setActiveLeg] = useState<string | null>(null)

  const flight      = allFlights.find(f => f.id === id) ?? null
  const allGroups   = groupFlightsByPnr(allFlights)
  const group       = flight ? allGroups.find(g => g.pnr === flight.pnr) : null
  const legs        = group?.legs ?? (flight ? [flight] : [])
  const currentFlight = legs.find(l => l.id === (activeLeg ?? id)) ?? flight
  const upcoming    = currentFlight?.status === 'upcoming'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Plane className="w-6 h-6 text-amber-400 animate-pulse" />
      </div>
    )
  }

  if (!flight || !currentFlight) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Plane className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="font-data text-sm text-muted-foreground">Flight not found</p>
          <button
            onClick={() => router.back()}
            className="font-data text-xs tracking-[0.12em] text-amber-400 hover:text-amber-300 transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background texture */}
      <div className="fixed inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[260px] rounded-full bg-amber-500/4 blur-[90px] pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-data text-xs tracking-[0.15em] uppercase">All flights</span>
        </button>

        {/* Connecting tabs — only shown when there are multiple legs */}
        {legs.length > 1 && (
          <div className="space-y-2">
            <p className="font-data text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              Connecting — {legs.length} legs · PNR {flight.pnr}
            </p>
            <div className="flex gap-2">
              {legs.map((leg, i) => (
                <button
                  key={leg.id}
                  onClick={() => setActiveLeg(leg.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-xs font-data tracking-[0.1em] transition-all',
                    (activeLeg ?? id) === leg.id
                      ? upcoming
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                        : 'border-border bg-muted/30 text-foreground'
                      : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground/70',
                  )}
                >
                  <span className="font-data text-[10px] tracking-[0.15em] text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>{leg.departure_airport}</span>
                  <Plane className="w-3 h-3 opacity-50" />
                  <span>{leg.arrival_airport}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boarding pass ticket */}
        <BoardingPassTicket
          flight={currentFlight}
          variant={upcoming ? 'upcoming' : 'completed'}
        />

        {/* Status note */}
        {upcoming && (
          <p className="text-center font-data text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            ✦ Keep this pass ready at the gate
          </p>
        )}
      </div>
    </div>
  )
}
