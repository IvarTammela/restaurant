export interface RestaurantTable {
  id: number;
  tableNumber: number;
  seats: number;
  posX: number;
  posY: number;
  zone: Zone;
  windowSeat: boolean;
  privateArea: boolean;
  nearPlayground: boolean;
  accessible: boolean;
  nearStage: boolean;
}

export type Zone = 'MAIN_HALL' | 'TERRACE' | 'PRIVATE_ROOM';

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

export interface Filters {
  date: string;
  time: string;
  partySize: number;
  zone: Zone | '';
  windowSeat: boolean;
  privateArea: boolean;
  nearPlayground: boolean;
  accessible: boolean;
  nearStage: boolean;
}
