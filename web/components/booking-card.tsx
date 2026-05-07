'use client'

import { useRouter } from 'next/navigation'
import { Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookingGroup } from '@/lib/types'

const MONTH = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const DAY   = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function fmt(iso: string) {
  const d = new Date(iso)
  return `${DAY[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2,'0')} ${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Compute layover time between leg[n].arrival and leg[n+1].departure (same date assumed) */
function layover(arrivalTime: string, departureTime: string): string {
  const [ah, am] = arrivalTime.split(':').map(Number)
  const [dh, dm] = departureTime.split(':').map(Number)
  const mins = (dh * 60 + dm) - (ah * 60 + am)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m layover` : `${m}m layover`
}

interface BookingCardProps {
  booking: BookingGroup
  className?: string
  style?: React.CSSProperties
}

export function BookingCard({ booking, className, style }: BookingCardProps) {
  const router = useRouter()
  const { legs, isConnecting } = booking
  const first = legs[0]
  const last  = legs[legs.length - 1]
  const upcoming = first.status === 'upcoming'

  const handleClick = () => router.push(`/dashboard/flights/${first.id}`)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      style={style}
      className={cn(
        'group relative rounded-xl border overflow-visible transition-all duration-300 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
        upcoming
          ? 'border-amber-500/30 bg-card animate-amber-glow hover:border-amber-500/60 hover:bg-card/80'
          : 'border-border bg-card hover:border-border/80',
        className,
      )}
    >
      {/* Top shimmer stripe */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-px',
        upcoming
          ? 'bg-gradient-to-r from-transparent via-amber-500/70 to-transparent'
          : 'bg-gradient-to-r from-transparent via-border to-transparent',
      )} />

      <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">

        {/* Row 1: airline(s) · flight number(s) · status */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-data text-[11px] tracking-[0.18em] text-muted-foreground uppercase truncate">
              {first.airline}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-border shrink-0" />
            <span className="font-data text-[11px] tracking-[0.2em] text-foreground/80 font-medium shrink-0">
              {isConnecting
                ? legs.map(l => l.flight_number).join(' · ')
                : first.flight_number}
            </span>
          </div>
          <span className={cn(
            'font-data text-[10px] tracking-[0.22em] uppercase px-2.5 py-0.5 rounded-md border shrink-0',
            upcoming
              ? 'text-amber-400 border-amber-500/30 bg-amber-500/8'
              : 'text-muted-foreground border-border bg-muted/20',
          )}>
            {upcoming ? 'UPCOMING' : 'COMPLETED'}
          </span>
        </div>

        {/* ── Route ──────────────────────────────────────────── */}
        {isConnecting ? (
          <MultiLegRoute legs={legs} upcoming={upcoming} />
        ) : (
          <SingleLegRoute flight={first} upcoming={upcoming} />
        )}

        {/* Date */}
        <div className="font-data text-[11px] tracking-[0.14em] text-muted-foreground mt-3">
          {fmt(first.date)}
        </div>
      </div>

      {/* Perforated separator */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[6px] w-3 h-3 rounded-full bg-background border border-border/50 z-10" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[6px] w-3 h-3 rounded-full bg-background border border-border/50 z-10" />
        <div className="border-t border-dashed border-border/50" />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1">
        {first.seat && (
          <Chip label="Seat" value={first.seat} />
        )}
        <Chip label="PNR" value={booking.pnr} />
        {!isConnecting && first.gate && (
          <Chip label="Gate" value={first.gate} highlight={upcoming} />
        )}
        {!isConnecting && first.terminal && (
          <Chip label="Terminal" value={first.terminal} />
        )}
        {isConnecting && (
          <Chip label="Stops" value={`${legs.length - 1} stop`} />
        )}
      </div>
    </article>
  )
}

function Chip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="font-data text-[9px] tracking-[0.2em] text-muted-foreground uppercase">{label}</div>
      <div className={cn(
        'font-data text-sm font-medium tracking-[0.12em]',
        highlight ? 'text-amber-400' : 'text-white',
      )}>{value}</div>
    </div>
  )
}

function SingleLegRoute({ flight, upcoming }: { flight: import('@/lib/types').Flight; upcoming: boolean }) {
  return (
    <div className="flex items-end gap-3">
      <div className="shrink-0">
        <div className="font-data text-[1.75rem] sm:text-[2.4rem] font-bold tracking-[0.05em] sm:tracking-[0.08em] text-white leading-none">
          {flight.departure_airport}
        </div>
        <div className="font-sans text-[11px] text-muted-foreground mt-1 uppercase tracking-wide leading-tight">
          {flight.departure_city}
        </div>
        <div className={cn('font-data text-sm font-medium mt-2 tabular-nums', upcoming ? 'text-amber-300' : 'text-foreground/70')}>
          {flight.departure_time}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-1 pb-1.5 min-w-0">
        {flight.duration && (
          <span className="font-data text-[10px] tracking-[0.15em] text-muted-foreground">{flight.duration}</span>
        )}
        <div className="w-full flex items-center gap-1">
          <div className="flex-1 h-px bg-border/60" />
          <Plane className={cn('w-4 h-4 shrink-0', upcoming ? 'text-amber-400' : 'text-muted-foreground/60')} />
          <div className="flex-1 h-px bg-border/60" />
        </div>
        <span className="font-data text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {flight.class_of_service ?? 'Economy'}
        </span>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-data text-[1.75rem] sm:text-[2.4rem] font-bold tracking-[0.05em] sm:tracking-[0.08em] text-white leading-none">
          {flight.arrival_airport}
        </div>
        <div className="font-sans text-[11px] text-muted-foreground mt-1 uppercase tracking-wide leading-tight">
          {flight.arrival_city}
        </div>
        <div className={cn('font-data text-sm font-medium mt-2 tabular-nums', upcoming ? 'text-amber-300' : 'text-foreground/70')}>
          {flight.arrival_time}
        </div>
      </div>
    </div>
  )
}

function MultiLegRoute({ legs, upcoming }: { legs: import('@/lib/types').Flight[]; upcoming: boolean }) {
  const first = legs[0]
  const last  = legs[legs.length - 1]
  const stops = legs.slice(0, -1)

  const viaLabel   = 'via ' + stops.map(l => l.arrival_airport).join(', ')
  const layoverStr = stops.length === 1
    ? layover(stops[0].arrival_time, legs[1].departure_time)
    : null

  return (
    <div className="flex items-end gap-3">
      {/* Departure — identical to SingleLegRoute */}
      <div className="shrink-0">
        <div className="font-data text-[1.75rem] sm:text-[2.4rem] font-bold tracking-[0.05em] sm:tracking-[0.08em] text-white leading-none">
          {first.departure_airport}
        </div>
        <div className="font-sans text-[11px] text-muted-foreground mt-1 uppercase tracking-wide leading-tight">
          {first.departure_city}
        </div>
        <div className={cn('font-data text-sm font-medium mt-2 tabular-nums', upcoming ? 'text-amber-300' : 'text-foreground/70')}>
          {first.departure_time}
        </div>
      </div>

      {/* Middle — route line with stop dot(s) */}
      <div className="flex-1 flex flex-col items-center gap-1 pb-1.5 min-w-0">
        <span className="font-data text-[10px] tracking-[0.1em] text-muted-foreground truncate max-w-full">
          {viaLabel}{layoverStr ? ` · ${layoverStr}` : ''}
        </span>
        <div className="w-full flex items-center gap-1">
          <div className="flex-1 h-px bg-border/60" />
          {stops.map(leg => (
            <div key={leg.id} className="flex items-center gap-1">
              <div className={cn(
                'w-1.5 h-1.5 rounded-full border shrink-0',
                upcoming ? 'border-amber-500/60 bg-amber-500/20' : 'border-border/60 bg-muted/20',
              )} />
              <div className="flex-1 h-px bg-border/60" />
            </div>
          ))}
          <Plane className={cn('w-4 h-4 shrink-0', upcoming ? 'text-amber-400' : 'text-muted-foreground/60')} />
          <div className="flex-1 h-px bg-border/60" />
        </div>
        <span className="font-data text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {stops.length} stop{stops.length > 1 ? 's' : ''} · {first.class_of_service ?? 'Economy'}
        </span>
      </div>

      {/* Arrival — identical to SingleLegRoute */}
      <div className="shrink-0 text-right">
        <div className="font-data text-[1.75rem] sm:text-[2.4rem] font-bold tracking-[0.05em] sm:tracking-[0.08em] text-white leading-none">
          {last.arrival_airport}
        </div>
        <div className="font-sans text-[11px] text-muted-foreground mt-1 uppercase tracking-wide leading-tight">
          {last.arrival_city}
        </div>
        <div className={cn('font-data text-sm font-medium mt-2 tabular-nums', upcoming ? 'text-amber-300' : 'text-foreground/70')}>
          {last.arrival_time}
        </div>
      </div>
    </div>
  )
}
