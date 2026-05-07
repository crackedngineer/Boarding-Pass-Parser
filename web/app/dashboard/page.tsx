"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";
import { useAuth } from "@/lib/hooks";
import { SyncScreen } from "@/components/sync-screen";
import { BookingCard } from "@/components/booking-card";
import { cn } from "@/lib/utils";
import { groupFlightsByPnr } from "@/lib/data/mock-flights";
import { useFlights } from "@/lib/hooks";
import { useGmailSyncContext } from "@/lib/context/gmail-sync-context";
import type { BookingGroup } from "@/lib/types";

function StatCard({
  value,
  label,
  variant = "neutral",
}: {
  value: number;
  label: string;
  variant?: "neutral" | "amber" | "muted";
}) {
  return (
    <div
      className={cn(
        "relative flex-1 rounded-xl border bg-card overflow-hidden px-4 py-3.5",
        variant === "amber" ? "border-amber-500/30" : "border-border/60",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          variant === "amber"
            ? "bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"
            : "bg-gradient-to-r from-transparent via-border/80 to-transparent",
        )}
      />
      <div
        className={cn(
          "font-data text-3xl font-semibold tabular-nums leading-none",
          variant === "amber" ? "text-amber-300" : "text-white/90",
        )}
      >
        {value}
      </div>
      <div className="font-data text-[9px] tracking-[0.22em] text-muted-foreground uppercase mt-1.5">
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { syncState, isFirstSync, initialized, startSync } =
    useGmailSyncContext();
  const { flights, isLoading: flightsLoading, refetch: refetchFlights } = useFlights();

  const bookings = groupFlightsByPnr(flights);

  // Derived — no state needed; SyncScreen manages its own fade-out internally
  const showSync = !["idle", "error"].includes(syncState.status);

  // Auto-start sync on first visit
  useEffect(() => {
    if (!initialized) return;
    if (isFirstSync && syncState.status === "idle") return startSync();
  }, [initialized, isFirstSync, syncState.status, startSync]);

  if (authLoading || flightsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Plane className="w-6 h-6 text-amber-400 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const upcoming = flights.filter((f) => f.status === "upcoming");
  const past = flights.filter((f) => f.status === "completed");
  const upcomingBookings = bookings.filter(
    (b) => b.legs[0].status === "upcoming",
  );
  const pastBookings = bookings.filter((b) => b.legs[0].status === "completed");

  return (
    <>
      {!showSync && (
        <SyncScreen
          syncStatus={syncState.status}
          emailsScanned={syncState.emailsScanned}
          boardingPassesFound={syncState.boardingPassesFound}
          onComplete={refetchFlights}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* ── Stats ──────────────────────────────────── */}
        <div className="flex gap-3 animate-reveal-up">
          <StatCard value={flights.length} label="Total flights" />
          <StatCard value={upcoming.length} label="Upcoming" variant="amber" />
          <StatCard value={past.length} label="Completed" variant="muted" />
        </div>

        {/* ── Upcoming bookings ──────────────────────── */}
        {upcomingBookings.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-data text-[11px] tracking-[0.3em] text-amber-500/80 uppercase">
                Upcoming · {upcoming.length}
              </h2>
              <div className="flex-1 h-px bg-amber-500/15" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {upcomingBookings.map((booking, i) => (
                <BookingCard
                  key={booking.pnr}
                  booking={booking}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="animate-reveal-up"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Past bookings ──────────────────────────── */}
        {pastBookings.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-data text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
                Completed · {past.length}
              </h2>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastBookings.map((booking, i) => (
                <BookingCard
                  key={booking.pnr}
                  booking={booking}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-reveal-up"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ────────────────────────────── */}
        {flights.length === 0 && syncState.status === "synced" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl border border-border bg-card flex items-center justify-center">
              <Plane className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm text-foreground/60 font-medium">
                No boarding passes found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No flight PDFs detected in your Gmail inbox.
              </p>
            </div>
            <button
              onClick={() => {
                startSync();
              }}
              className="text-xs font-data tracking-[0.12em] text-amber-400 hover:text-amber-300 transition-colors"
            >
              Sync again →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
