import httpClient from './http-client'

interface AirlineInterface {
  iata_code: string;
  name: string | null;
}

interface AirportInterface {
  iata_code: string;
  name: string | null;
  city: string | null;
}

interface BoardingPassInterface {
  id: string;
  passenger: {
    first_name: string;
    last_name: string;
  };
  seat_number: string | null;
  cabin_class: string | null;
  boarding_group: string | null;
  barcode: string;
}

interface FlightInterface {
  id: string;
  flight_number: string;
  airline: AirlineInterface;
  departure_airport: AirportInterface;
  arrival_airport: AirportInterface;
  departure_time: string | null;
  arrival_time: string | null;
  status: string;
  gate: string | null;
  terminal: string | null;
  boarding_passes: BoardingPassInterface[];
}

export interface BookingResponse {
  id: string;
  pnr_code: string;
  booking_type: string;
  start_date: string | null;
  end_date: string | null;
  airline: AirlineInterface;
  source: string;
  flights: FlightInterface[];
}

export async function listBookings(status?: string): Promise<BookingResponse[]> {
  const q = status ? `?status=${status}` : ''
  const data = await httpClient.get<{ bookings: BookingResponse[]; total: number }>(`/bookings/${q}`)
  return data.bookings
}

export async function getBooking(id: string): Promise<BookingResponse> {
  return httpClient.get<BookingResponse>(`/bookings/${id}`)
}
