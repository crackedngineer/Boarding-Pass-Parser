'use client';

import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Flight } from '@/lib/types';

interface FlightCardProps {
  flight: Flight;
  className?: string;
  style?: React.CSSProperties;
}

const MONTH = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAY   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${DAY[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2,'0')} ${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function FlightCard({ flight, className, style }: FlightCardProps) {
  const upcoming = flight.status === 'upcoming';

  return (
    <article
      style={style}
      className={cn(
        'group relative rounded-xl border overflow-visible transition-all duration-300',
        upcoming
          ? 'border-amber-500/30 bg-card animate-amber-glow hover:border-amber-500/50'
          : 'border-border bg-card hover:border-border/80 hover:bg-card',
        className,
      )}
    >
      {/* Top status stripe */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-px',
          upcoming
            ? 'bg-gradient-to-r from-transparent via-amber-500/70 to-transparent'
            : 'bg-gradient-to-r from-transparent via-border to-transparent',
        )}
      />

      {/* ── Main body ──────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">

        {/* Row 1: airline · flight · status badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-data text-[11px] tracking-[0.18em] text-muted-foreground uppercase truncate">
              {flight.airline}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-border shrink-0" />
            <span className="font-data text-[11px] tracking-[0.2em] text-foreground/80 font-medium shrink-0">
              {flight.flight_number}
            </span>
          </div>

          <span
            className={cn(
              'font-data text-[10px] tracking-[0.22em] uppercase px-2.5 py-0.5 rounded-md border shrink-0',
              upcoming
                ? 'text-amber-400 border-amber-500/30 bg-amber-500/8'
                : 'text-muted-foreground border-border bg-muted/20',
            )}
          >
            {upcoming ? 'UPCOMING' : 'COMPLETED'}
          </span>
        </div>

        {/* Row 2: departure ──✈── arrival */}
        <div className="flex items-end gap-3">

          {/* Departure */}
          <div className="shrink-0">
            <div className="font-data text-[2.4rem] font-bold tracking-[0.08em] text-white leading-none">
              {flight.departure_airport}
            </div>
            <div className="font-sans text-[11px] text-muted-foreground mt-1 uppercase tracking-wide leading-tight">
              {flight.departure_city}
            </div>
            <div
              className={cn(
                'font-data text-sm font-medium mt-2 tabular-nums',
                upcoming ? 'text-amber-300' : 'text-foreground/70',
              )}
            >
              {flight.departure_time}
            </div>
          </div>

          {/* Route line */}
          <div className="flex-1 flex flex-col items-center gap-1 pb-1.5 min-w-0">
            {flight.duration && (
              <span className="font-data text-[10px] tracking-[0.15em] text-muted-foreground">
                {flight.duration}
              </span>
            )}
            <div className="w-full flex items-center gap-1">
              <div className="flex-1 h-px bg-border/60" />
              <Plane
                className={cn(
                  'w-4 h-4 shrink-0',
                  upcoming ? 'text-amber-400' : 'text-muted-foreground/60',
                )}
              />
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <span className="font-data text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              {flight.class_of_service ?? 'Economy'}
            </span>
          </div>

          {/* Arrival */}
          <div className="shrink-0 text-right">
            <div className="font-data text-[2.4rem] font-bold tracking-[0.08em] text-white leading-none">
              {flight.arrival_airport}
            </div>
            <div className="font-sans text-[11px] text-muted-foreground mt-1 uppercase tracking-wide leading-tight">
              {flight.arrival_city}
            </div>
            <div
              className={cn(
                'font-data text-sm font-medium mt-2 tabular-nums',
                upcoming ? 'text-amber-300' : 'text-foreground/70',
              )}
            >
              {flight.arrival_time}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="font-data text-[11px] tracking-[0.14em] text-muted-foreground mt-3">
          {formatDate(flight.date)}
        </div>
      </div>

      {/* ── Perforated separator ──────────────────────── */}
      <div className="relative px-0 mx-0">
        {/* Left notch */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[6px] w-3 h-3 rounded-full bg-background border border-border/50 z-10" />
        {/* Right notch */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[6px] w-3 h-3 rounded-full bg-background border border-border/50 z-10" />
        {/* Dashed line */}
        <div className="mx-0 border-t border-dashed border-border/50" />
      </div>

      {/* ── Footer: seat · PNR · gate · terminal ─────── */}
      <div className="px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-1">
        {flight.seat && (
          <div>
            <div className="font-data text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Seat</div>
            <div className="font-data text-sm font-medium tracking-[0.12em] text-white">{flight.seat}</div>
          </div>
        )}
        {flight.pnr && (
          <div>
            <div className="font-data text-[9px] tracking-[0.2em] text-muted-foreground uppercase">PNR</div>
            <div className="font-data text-sm font-medium tracking-[0.12em] text-white">{flight.pnr}</div>
          </div>
        )}
        {flight.gate && (
          <div>
            <div className="font-data text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Gate</div>
            <div
              className={cn(
                'font-data text-sm font-medium tracking-[0.12em]',
                upcoming ? 'text-amber-400' : 'text-white',
              )}
            >
              {flight.gate}
            </div>
          </div>
        )}
        {flight.terminal && (
          <div>
            <div className="font-data text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Terminal</div>
            <div className="font-data text-sm font-medium tracking-[0.12em] text-white">{flight.terminal}</div>
          </div>
        )}
      </div>
    </article>
  );
}
