import type { Filters, FloorElement, Reservation, RestaurantTable, TableRecommendation, Zone } from './types';

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

export async function updateTablePosition(id: number, posX: number, posY: number): Promise<RestaurantTable> {
  const res = await fetch(`${BASE}/tables/${id}/position`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posX, posY }),
  });
  return res.json();
}

export async function createNewTable(data: {
  tableNumber: number;
  seats: number;
  zone: Zone;
  posX: number;
  posY: number;
}): Promise<RestaurantTable> {
  const res = await fetch(`${BASE}/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTable(id: number, data: {
  seats: number;
  zone: string;
  windowSeat: boolean;
  privateArea: boolean;
  nearPlayground: boolean;
  accessible: boolean;
  nearStage: boolean;
}): Promise<RestaurantTable> {
  const res = await fetch(`${BASE}/tables/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTable(id: number): Promise<void> {
  await fetch(`${BASE}/tables/${id}`, { method: 'DELETE' });
}

export interface RoomDTO {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export async function fetchRooms(): Promise<RoomDTO[]> {
  const res = await fetch(`${BASE}/rooms`);
  return res.json();
}

// --- Floor Elements ---

export async function fetchElements(): Promise<FloorElement[]> {
  const res = await fetch(`${BASE}/elements`);
  return res.json();
}

export async function createElement(data: {
  type: string;
  name: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
}): Promise<FloorElement> {
  const res = await fetch(`${BASE}/elements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateElement(id: number, data: Partial<FloorElement>): Promise<FloorElement> {
  const res = await fetch(`${BASE}/elements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteElement(id: number): Promise<void> {
  await fetch(`${BASE}/elements/${id}`, { method: 'DELETE' });
}
