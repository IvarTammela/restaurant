import type { Filters, FloorElement, Reservation, RestaurantTable, TableRecommendation, Wall } from './types';

const BASE = import.meta.env.DEV ? 'http://localhost:8080/api' : '/api';

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
  zone: string;
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

export async function deleteAllTables(): Promise<void> {
  await fetch(`${BASE}/tables`, { method: 'DELETE' });
}

export interface RoomDTO {
  id: number;
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

export async function createRoom(data: { name: string; x: number; y: number; w: number; h: number }): Promise<RoomDTO> {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteRoom(id: number): Promise<void> {
  await fetch(`${BASE}/rooms/${id}`, { method: 'DELETE' });
}

export async function deleteAllRooms(): Promise<void> {
  await fetch(`${BASE}/rooms`, { method: 'DELETE' });
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

export async function deleteAllElements(): Promise<void> {
  await fetch(`${BASE}/elements`, { method: 'DELETE' });
}

// --- Walls ---

export async function fetchWalls(): Promise<Wall[]> {
  try {
    const res = await fetch(`${BASE}/walls`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function createWall(data: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  thickness: number;
}): Promise<Wall> {
  const res = await fetch(`${BASE}/walls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteWall(id: number): Promise<void> {
  await fetch(`${BASE}/walls/${id}`, { method: 'DELETE' });
}

export async function deleteAllWalls(): Promise<void> {
  await fetch(`${BASE}/walls`, { method: 'DELETE' });
}
