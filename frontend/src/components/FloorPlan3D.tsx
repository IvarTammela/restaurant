import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { RestaurantTable, TableRecommendation, Reservation, FloorElement } from '../types';
import Room from './three/Room';
import Lighting from './three/Lighting';
import Furniture from './three/Furniture';
import Table3D from './three/Table3D';

interface Props {
  tables: RestaurantTable[];
  recommendations: TableRecommendation[];
  reservations: Reservation[];
  floorElements: FloorElement[];
  selectedTable: RestaurantTable | null;
  filterDate: string;
  filterTime: string;
  onSelectTable: (table: RestaurantTable) => void;
}

export default function FloorPlan3D({
  tables,
  recommendations,
  reservations,
  floorElements,
  selectedTable,
  filterDate,
  filterTime,
  onSelectTable,
}: Props) {
  // Score map
  const scoreMap = new Map(recommendations.map((r) => [r.table.id, r.score]));

  // Combined map + single recommended IDs
  const combinedMap = new Map<number, RestaurantTable>();
  const singleRecommendedIds = new Set<number>();

  recommendations.forEach((r) => {
    if (r.combinedWith) {
      combinedMap.set(r.table.id, r.combinedWith);
      combinedMap.set(r.combinedWith.id, r.table);
    } else {
      singleRecommendedIds.add(r.table.id);
    }
  });

  // Occupied tables
  const occupiedIds = new Set(
    reservations
      .filter((r) => {
        if (!filterDate || !filterTime) return false;
        if (r.date !== filterDate) return false;
        const check = filterTime + ':00';
        return check >= r.startTime && check < r.endTime;
      })
      .map((r) => r.table.id)
  );

  const hasSearched = recommendations.length > 0 || filterDate !== '';
  const bestScore = recommendations.length > 0 ? recommendations[0].score : 0;

  function getTableStatus(table: RestaurantTable): 'available' | 'occupied' | 'recommended' | 'selected' {
    if (selectedTable?.id === table.id) return 'selected';
    if (combinedMap.has(table.id) || singleRecommendedIds.has(table.id)) return 'recommended';
    if (occupiedIds.has(table.id)) return 'occupied';
    return 'available';
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas
        shadows
        camera={{ position: [0, 18, 10], fov: 50 }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <Room />
          <Furniture elements={floorElements} />
          {tables.map((table) => {
            const status = getTableStatus(table);
            const score = scoreMap.get(table.id);
            const isCombined = combinedMap.has(table.id);
            const isBest = score !== undefined && score === bestScore && hasSearched && !isCombined;

            return (
              <Table3D
                key={table.id}
                table={table}
                status={status}
                isBest={isBest}
                onClick={() => status !== 'occupied' && onSelectTable(table)}
              />
            );
          })}
          <OrbitControls
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={30}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
