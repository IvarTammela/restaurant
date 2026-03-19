import { useState } from 'react';
import FloorPlan from './FloorPlan';
import FloorPlan3D from './FloorPlan3D';
import type { RestaurantTable, TableRecommendation, Reservation, FloorElement } from '../types';

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

export default function FloorPlanWrapper(props: Props) {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  return (
    <div className="floor-plan-container">
      <div className="floor-plan-header">
        <h2>Saali plaan</h2>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            2D
          </button>
          <button
            className={`toggle-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D
          </button>
        </div>
      </div>

      {/* Legend stays visible in both modes */}
      {viewMode === '2d' ? (
        <FloorPlan {...props} />
      ) : (
        <FloorPlan3D {...props} />
      )}
    </div>
  );
}
