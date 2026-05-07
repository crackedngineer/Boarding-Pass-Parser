'use client';

import { Plane } from 'lucide-react';
import { AuthForm } from '@/components/auth-form';

const DEMO = {
  from: 'DEL', fromCity: 'New Delhi',
  to:   'DXB', toCity:   'Dubai',
  departs: '11:25', arrives: '14:00',
  flight: '6E 55', seat: '22A', gate: 'G7', terminal: 'T2',
  duration: '3h 35m',
};

const DETAILS = [
  { label: 'Departs',  value: DEMO.departs  },
  { label: 'Arrives',  value: DEMO.arrives  },
  { label: 'Flight',   value: DEMO.flight   },
  { label: 'Seat',     value: DEMO.seat     },
  { label: 'Terminal', value: DEMO.terminal },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left panel — departure display (desktop only) ─── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden border-r border-border/40">

        {/* Layered atmosphere */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-blue-900/[0.08]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-amber-500/[0.05] blur-[140px] pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 p-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-amber-500/25 bg-amber-500/8 flex items-center justify-center">
            <Plane className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-data text-[11px] tracking-[0.35em] text-amber-500/60 uppercase">
            FlightTrackr
          </span>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-12 gap-10">

          {/* Status badge */}
          <div className="flex items-center gap-2.5 animate-reveal-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="font-data text-[10px] tracking-[0.4em] text-amber-400/75 uppercase">
              Now boarding · Gate {DEMO.gate}
            </span>
          </div>

          {/* Oversized route */}
          <div className="flex items-end gap-6" style={{ animationDelay: '60ms' }}>
            <div className="animate-reveal-up" style={{ animationDelay: '60ms' }}>
              <div className="font-data text-[6rem] font-bold tracking-[0.03em] text-white leading-none">
                {DEMO.from}
              </div>
              <div className="font-sans text-xs text-muted-foreground/60 uppercase tracking-[0.25em] mt-2">
                {DEMO.fromCity}
              </div>
              <div className="font-data text-2xl font-medium text-amber-300/80 tabular-nums mt-3">
                {DEMO.departs}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 pb-10 animate-reveal-up" style={{ animationDelay: '100ms' }}>
              <span className="font-data text-[10px] tracking-[0.15em] text-muted-foreground/40">
                {DEMO.duration}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-px bg-border/50" />
                <Plane className="w-4 h-4 text-amber-400/60 shrink-0" />
                <div className="w-16 h-px bg-border/50" />
              </div>
              <span className="font-data text-[9px] tracking-[0.2em] text-muted-foreground/30 uppercase">
                Economy
              </span>
            </div>

            <div className="text-right animate-reveal-up" style={{ animationDelay: '120ms' }}>
              <div className="font-data text-[6rem] font-bold tracking-[0.03em] text-white leading-none">
                {DEMO.to}
              </div>
              <div className="font-sans text-xs text-muted-foreground/60 uppercase tracking-[0.25em] mt-2">
                {DEMO.toCity}
              </div>
              <div className="font-data text-2xl font-medium text-amber-300/80 tabular-nums mt-3">
                {DEMO.arrives}
              </div>
            </div>
          </div>

          {/* Metadata bar */}
          <div
            className="border-t border-border/30 pt-8 flex items-center gap-10 animate-reveal-up"
            style={{ animationDelay: '160ms' }}
          >
            {DETAILS.map(({ label, value }) => (
              <div key={label}>
                <div className="font-data text-[9px] tracking-[0.28em] text-muted-foreground/40 uppercase">
                  {label}
                </div>
                <div className="font-data text-sm font-medium tracking-[0.14em] text-white/70 mt-1">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom copy */}
          <p
            className="text-sm text-muted-foreground/50 max-w-sm leading-relaxed font-sans animate-reveal-up"
            style={{ animationDelay: '200ms' }}
          >
            Every boarding pass you have ever received — automatically decoded, organised, and always with you.
          </p>
        </div>

        {/* Bottom ticker */}
        <div className="relative z-10 border-t border-border/30 px-12 py-4">
          <p className="font-data text-[9px] tracking-[0.3em] text-muted-foreground/25 uppercase">
            BCBP · IATA Type M · Single segment · Read-only Gmail access
          </p>
        </div>
      </div>

      {/* ── Right panel — sign-in form ─────────────────────── */}
      <div className="flex-1 lg:flex-none lg:w-[440px] flex flex-col relative overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
        <div className="absolute -top-24 -right-16 w-[280px] h-[280px] rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 left-0 w-[200px] h-[200px] rounded-full bg-blue-600/4 blur-[70px] pointer-events-none" />

        {/* Form area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm space-y-10">

            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 lg:hidden animate-reveal-up">
              <div className="w-8 h-8 rounded-lg border border-amber-500/25 bg-amber-500/8 flex items-center justify-center">
                <Plane className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-data text-[11px] tracking-[0.35em] text-amber-500/60 uppercase">
                FlightTrackr
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3 animate-reveal-up">
              <p className="font-data text-[10px] tracking-[0.35em] text-amber-500/50 uppercase">
                Your flights
              </p>
              <h1 className="text-[2.75rem] font-bold text-white leading-[1.08] tracking-tight">
                All in<br />one place.
              </h1>
              <p className="text-sm text-muted-foreground/70 leading-relaxed pt-1">
                Sign in and we will automatically pull every boarding pass from your Gmail inbox.
              </p>
            </div>

            {/* Auth */}
            <div className="animate-reveal-up" style={{ animationDelay: '80ms' }}>
              <AuthForm />
            </div>

            {/* Features */}
            <div className="space-y-2.5 animate-reveal-up" style={{ animationDelay: '140ms' }}>
              {[
                'Reads boarding passes directly from Gmail',
                'Decodes BCBP barcodes automatically',
                'Full flight history in one dashboard',
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-amber-500/50 shrink-0" />
                  <span className="font-data text-[10px] tracking-[0.1em] text-muted-foreground/55 leading-relaxed">
                    {text}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 pb-6">
          <p className="text-center text-[11px] text-muted-foreground/30">
            © 2026 FlightTrackr
          </p>
        </div>
      </div>

    </div>
  );
}
