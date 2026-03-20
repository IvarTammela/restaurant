export interface RestaurantTable {
  id: number;
  tableNumber: number;
  seats: number;
  posX: number;
  posY: number;
  zone: string;
  windowSeat: boolean;
  privateArea: boolean;
  nearPlayground: boolean;
  accessible: boolean;
  nearStage: boolean;
}

export interface Reservation {
  id: number;
  table: RestaurantTable;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
}

export interface TableRecommendation {
  table: RestaurantTable;
  score: number;
  combinedWith?: RestaurantTable;
}

export interface FloorElement {
  id: number;
  type: string;
  name: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Wall {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  thickness: number;
}

export interface Filters {
  date: string;
  time: string;
  partySize: number;
  zone: string;
  windowSeat: boolean;
  privateArea: boolean;
  nearPlayground: boolean;
  accessible: boolean;
  nearStage: boolean;
}
