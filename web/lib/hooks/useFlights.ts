"use client";

import { useState, useEffect, useCallback } from "react";
import { listBookings, BookingResponse } from "@/lib/api/flight-service";
import type { Flight, FlightStatus, FlightSource } from "@/lib/types";

function extractTime(iso: string | null): string {
  if (!iso) return '';
  if (/^\d{2}:\d{2}$/.test(iso)) return iso;
  try {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
}

function extractDate(iso: string | null): string {
  if (!iso) return '';
  return iso.split('T')[0] ?? iso;
}

export function useFlights(status?: string) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bookings = await listBookings(status);
      const allFlights: Flight[] = bookings.flatMap((booking: BookingResponse) =>
        booking.flights.map((flight) => {
          const bp = flight.boarding_passes[0] ?? null;
          const passengerName = bp
            ? `${bp.passenger.first_name} ${bp.passenger.last_name}`.trim()
            : undefined;
          const depDate = extractDate(flight.departure_time) || extractDate(booking.start_date);

          return {
            id: flight.id,
            flight_number: flight.flight_number,
            airline: flight.airline?.name ?? booking.airline?.name ?? '',
            airline_code: flight.airline?.iata_code ?? booking.airline?.iata_code ?? '',
            passenger_name: passengerName,
            departure_airport: flight.departure_airport.iata_code,
            departure_city: flight.departure_airport.city ?? '',
            arrival_airport: flight.arrival_airport.iata_code,
            arrival_city: flight.arrival_airport.city ?? '',
            departure_time: extractTime(flight.departure_time),
            arrival_time: extractTime(flight.arrival_time),
            date: depDate,
            seat: bp?.seat_number ?? null,
            pnr: booking.pnr_code,
            gate: flight.gate,
            terminal: flight.terminal,
            class_of_service: bp?.cabin_class ?? null,
            status: flight.status as FlightStatus,
            duration: null,
            source: booking.source as FlightSource,
            parsed_at: booking.start_date ?? new Date().toISOString(),
          } satisfies Flight;
        })
      );
      setFlights(allFlights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load flights");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { flights, isLoading, error, refetch };
}
