import { useState } from 'react';
import AdminFloorPlan from './AdminFloorPlan';
import FloorPlan3D from './FloorPlan3D';
import type { RestaurantTable, FloorElement, Wall } from '../types';

interface Props {
  tables: RestaurantTable[];
  floorElements: FloorElement[];
  walls: Wall[];
  onTablesChange: () => void;
  onElementsChange: () => void;
  onWallsChange: () => void;
}

export default function AdminFloorPlanWrapper(props: Props) {
  const [preview3D, setPreview3D] = useState(false);

  return (
    <div>
      <div className="admin-preview-toggle">
        <button
          className={`toggle-btn ${!preview3D ? 'active' : ''}`}
          onClick={() => setPreview3D(false)}
        >
          ✏️ Redigeerimine (2D)
        </button>
        <button
          className={`toggle-btn ${preview3D ? 'active' : ''}`}
          onClick={() => setPreview3D(true)}
        >
          👁 3D Eelvaade
        </button>
      </div>

      {preview3D ? (
        <FloorPlan3D
          tables={props.tables}
          recommendations={[]}
          reservations={[]}
          floorElements={props.floorElements}
          selectedTable={null}
          filterDate=""
          filterTime=""
          onSelectTable={() => {}}
        />
      ) : (
        <AdminFloorPlan {...props} />
      )}
    </div>
  );
}
