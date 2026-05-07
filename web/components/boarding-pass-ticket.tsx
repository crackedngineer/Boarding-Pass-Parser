'use client'

import { Plane } from 'lucide-react'
import QRCode from 'react-qr-code'
import { cn } from '@/lib/utils'
import type { Flight } from '@/lib/types'

const MONTH = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const DAY   = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${DAY[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2,'0')} ${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function qrPayload(f: Flight) {
  return [
    f.passenger_name ?? 'PASSENGER',
    f.pnr ?? '',
    f.departure_airport,
    f.arrival_airport,
    f.flight_number.replace(' ', ''),
    f.date,
    f.seat ?? '',
  ].join('/')
}

interface Props {
  flight: Flight
  /** highlight for upcoming vs past */
  variant?: 'upcoming' | 'completed'
}

export function BoardingPassTicket({ flight, variant = 'upcoming' }: Props) {
  const upcoming = variant === 'upcoming'

  return (
    <div className={cn(
      'relative w-full max-w-lg mx-auto rounded-2xl border overflow-hidden',
      upcoming
        ? 'border-amber-500/30 bg-card animate-amber-glow'
        : 'border-border bg-card',
    )}>
      {/* Top shimmer */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-px',
        upcoming
          ? 'bg-gradient-to-r from-transparent via-amber-500/70 to-transparent'
          : 'bg-gradient-to-r from-transparent via-border/60 to-transparent',
      )} />

      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center border',
            upcoming ? 'border-amber-500/30 bg-amber-500/10' : 'border-border bg-muted/20',
          )}>
            <Plane className={cn('w-3.5 h-3.5', upcoming ? 'text-amber-400' : 'text-muted-foreground')} />
          </div>
          <span className="font-data text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            Boarding Pass
          </span>
        </div>
        <div className="text-right">
          <div className="font-data text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            {flight.airline}
          </div>
          <div className={cn(
            'font-data text-xs font-medium tracking-[0.15em]',
            upcoming ? 'text-amber-400' : 'text-foreground/70',
          )}>
            {flight.flight_number}
          </div>
        </div>
      </div>

      {/* ── Passenger ─────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 pb-3">
        <div className="font-data text-[9px] tracking-[0.25em] text-muted-foreground uppercase mb-0.5">Passenger</div>
        <div className="font-data text-base font-semibold tracking-[0.12em] text-white">
          {flight.passenger_name ?? '—'}
        </div>
      </div>

      {/* ── Route ─────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-end gap-2 sm:gap-4">
        {/* Departure */}
        <div className="shrink-0">
          <div className="font-data text-[2rem] sm:text-[3rem] font-bold tracking-[0.04em] sm:tracking-[0.06em] text-white leading-none">
            {flight.departure_airport}
          </div>
          <div className="font-sans text-[10px] sm:text-[11px] text-muted-foreground mt-1 sm:mt-1.5 uppercase tracking-wide">
            {flight.departure_city}
          </div>
          <div className={cn('font-data text-base sm:text-lg font-semibold mt-1.5 sm:mt-2 tabular-nums', upcoming ? 'text-amber-300' : 'text-foreground/70')}>
            {flight.departure_time}
          </div>
        </div>

        {/* Route line */}
        <div className="flex-1 flex flex-col items-center gap-1 sm:gap-1.5 pb-2 min-w-0">
          {flight.duration && (
            <span className="font-data text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.18em] text-muted-foreground">{flight.duration}</span>
          )}
          <div className="w-full flex items-center gap-1 sm:gap-1.5">
            <div className="flex-1 h-px bg-border/50" />
            <Plane className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', upcoming ? 'text-amber-400' : 'text-muted-foreground/50')} />
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <span className="font-data text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.15em] text-muted-foreground uppercase">
            {flight.class_of_service ?? 'Economy'}
          </span>
        </div>

        {/* Arrival */}
        <div className="shrink-0 text-right">
          <div className="font-data text-[2rem] sm:text-[3rem] font-bold tracking-[0.04em] sm:tracking-[0.06em] text-white leading-none">
            {flight.arrival_airport}
          </div>
          <div className="font-sans text-[10px] sm:text-[11px] text-muted-foreground mt-1 sm:mt-1.5 uppercase tracking-wide">
            {flight.arrival_city}
          </div>
          <div className={cn('font-data text-base sm:text-lg font-semibold mt-1.5 sm:mt-2 tabular-nums', upcoming ? 'text-amber-300' : 'text-foreground/70')}>
            {flight.arrival_time}
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="px-4 sm:px-6 pb-4">
        <span className="font-data text-[11px] tracking-[0.18em] text-muted-foreground">{fmtDate(flight.date)}</span>
      </div>

      {/* ── Details grid ──────────────────────────────────── */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-5 grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 border-t border-border/40 pt-4">
        {[
          { label: 'Seat',     value: flight.seat },
          { label: 'Class',    value: flight.class_of_service?.slice(0,3).toUpperCase() },
          { label: 'Gate',     value: flight.gate,     hi: upcoming },
          { label: 'Terminal', value: flight.terminal },
          { label: 'PNR',      value: flight.pnr },
        ].map(({ label, value, hi }) => value ? (
          <div key={label}>
            <div className="font-data text-[9px] tracking-[0.22em] text-muted-foreground uppercase">{label}</div>
            <div className={cn('font-data text-sm font-semibold tracking-[0.14em] mt-0.5', hi ? 'text-amber-400' : 'text-white')}>
              {value}
            </div>
          </div>
        ) : null)}
      </div>

      {/* ── Perforated tear ───────────────────────────────── */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[7px] w-3.5 h-3.5 rounded-full bg-background border border-border/50 z-10" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[7px] w-3.5 h-3.5 rounded-full bg-background border border-border/50 z-10" />
        <div className="border-t border-dashed border-border/60" />
      </div>

      {/* ── QR code stub ──────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col items-center gap-3">
        <div className={cn(
          'p-3 rounded-xl border',
          upcoming ? 'border-amber-500/20 bg-white' : 'border-border bg-white',
        )}>
          <QRCode
            value={qrPayload(flight)}
            size={140}
            fgColor="#0a0a0a"
            bgColor="#ffffff"
            level="M"
          />
        </div>
        <p className="font-data text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Scan at gate
        </p>
      </div>
    </div>
  )
}
