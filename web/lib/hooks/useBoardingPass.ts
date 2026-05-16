"use client";

import { useState, useCallback } from "react";
import { uploadBoardingPass } from "@/lib/api/boarding-pass-service";
import type { BookingResponse } from "@/lib/api/flight-service";
import type { Flight, FlightStatus, FlightSource } from "@/lib/types";
import { ApiClientError } from "@/lib/types";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadState {
  status: UploadStatus;
  booking: BookingResponse | null;
  flights: Flight[];
  error: string | null;
}

function extractTime(iso: string | null): string {
  if (!iso) return "";
  if (/^\d{2}:\d{2}$/.test(iso)) return iso;
  try {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function extractDate(iso: string | null): string {
  if (!iso) return "";
  return iso.split("T")[0] ?? iso;
}

function mapBookingToFlights(booking: BookingResponse): Flight[] {
  return booking.flights.map((flight) => {
    const bp = flight.boarding_passes[0] ?? null;
    const depDate =
      extractDate(flight.departure_time) || extractDate(booking.start_date);
    return {
      id: flight.id,
      flight_number: flight.flight_number,
      airline: flight.airline?.name ?? booking.airline?.name ?? "",
      airline_code:
        flight.airline?.iata_code ?? booking.airline?.iata_code ?? "",
      passenger_name: bp
        ? `${bp.passenger.first_name} ${bp.passenger.last_name}`.trim()
        : undefined,
      departure_airport: flight.departure_airport.iata_code,
      departure_city: flight.departure_airport.city ?? "",
      arrival_airport: flight.arrival_airport.iata_code,
      arrival_city: flight.arrival_airport.city ?? "",
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
  });
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function useBoardingPass() {
  const [state, setState] = useState<UploadState>({
    status: "idle",
    booking: null,
    flights: [],
    error: null,
  });

  const upload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Only PDF files are supported",
      }));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "File too large — maximum 5 MB",
      }));
      return;
    }
    if (file.size === 0) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "File is empty",
      }));
      return;
    }

    setState((prev) => ({ ...prev, status: "uploading", error: null }));

    try {
      const booking = await uploadBoardingPass(file);
      const flights = mapBookingToFlights(booking);
      setState({ status: "success", booking, flights, error: null });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to parse boarding pass";
      setState((prev) => ({
        ...prev,
        status: "error",
        booking: null,
        flights: [],
        error: message,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", booking: null, flights: [], error: null });
  }, []);

  return { ...state, upload, reset };
}
