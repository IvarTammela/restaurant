import type { Filters, Reservation, RestaurantTable, TableRecommendation } from './types';

const BASE = 'http://localhost:8080/api';

export async function fetchAllTables(): Promise<RestaurantTable[]> {
  const res = await fetch(`${BASE}/tables`);
  return res.json();
}

export async function fetchRecommendations(filters: Filters): Promise<TableRecommendation[]> {
  const params = new URLSearchParams({
    date: filters.date,
    time: filters.time,
    partySize: String(filters.partySize),
    windowSeat: String(filters.windowSeat),
    privateArea: String(filters.privateArea),
    nearPlayground: String(filters.nearPlayground),
    accessible: String(filters.accessible),
    nearStage: String(filters.nearStage),
  });
  if (filters.zone) params.set('zone', filters.zone);

  const res = await fetch(`${BASE}/tables/recommend?${params}`);
  return res.json();
}

export async function fetchReservations(): Promise<Reservation[]> {
  const res = await fetch(`${BASE}/reservations`);
  return res.json();
}

export async function createReservation(data: {
  tableId: number;
  customerName: string;
  date: string;
  startTime: string;
  partySize: number;
}): Promise<Reservation> {
  const res = await fetch(`${BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Reservation failed');
  }
  return res.json();
}
