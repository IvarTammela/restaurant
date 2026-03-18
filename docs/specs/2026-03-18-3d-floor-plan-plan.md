# 3D Floor Plan (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive Three.js 3D restaurant floor plan view alongside the existing 2D view, with a toggle to switch between them.

**Architecture:** FloorPlanWrapper replaces FloorPlan in App.tsx, containing both 2D and 3D views controlled by a viewMode state. The 3D scene uses @react-three/fiber for React integration and @react-three/drei for OrbitControls. Table positions map from percentage (0-100) to Three.js world coordinates. Same props and callbacks flow to both views.

**Tech Stack:** Three.js, @react-three/fiber, @react-three/drei, React 19, TypeScript

---

### Task 1: Install Three.js dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install packages**

```bash
cd frontend && npm install three @react-three/fiber @react-three/drei
```

- [ ] **Step 2: Install type definitions**

```bash
cd frontend && npm install -D @types/three
```

- [ ] **Step 3: Verify dev server still works**

```bash
cd frontend && npm run dev
```
Expected: Vite starts without errors on http://localhost:5173

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: add Three.js and React Three Fiber dependencies"
```

---

### Task 2: Create FloorPlan3D component with empty scene

**Files:**
- Create: `frontend/src/components/FloorPlan3D.tsx`

- [ ] **Step 1: Create the 3D component with basic Canvas**

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

const ROOM_WIDTH = 20;
const ROOM_DEPTH = 15;

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
  return (
    <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 18, 10], fov: 50 }}
        shadows
      >
        <ambientLight intensity={0.4} color="#ffeedd" />
        <directionalLight
          position={[8, 12, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Ground plane */}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
          <meshStandardMaterial color="#d4b896" />
        </mesh>

        <OrbitControls
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={30}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Temporarily render in App.tsx to verify**

In App.tsx, import FloorPlan3D and render it below the existing FloorPlan to test. Just add `<FloorPlan3D {...same props as FloorPlan} />` under the FloorPlan component.

- [ ] **Step 3: Verify in browser**

Open http://localhost:5173 — should see a brown plane below the 2D floor plan with orbit controls (drag to rotate, scroll to zoom).

- [ ] **Step 4: Remove temporary render, commit**

Remove the temporary FloorPlan3D render from App.tsx (we'll add the wrapper next).

```bash
git add frontend/src/components/FloorPlan3D.tsx
git commit -m "feat: add FloorPlan3D component with basic scene and orbit controls"
```

---

### Task 3: Build Room geometry (walls, floor zones, ceiling)

**Files:**
- Create: `frontend/src/components/three/Room.tsx`
- Modify: `frontend/src/components/FloorPlan3D.tsx`

- [ ] **Step 1: Create Room component**

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';

const ROOM_WIDTH = 20;   // X axis
const ROOM_DEPTH = 15;   // Z axis
const WALL_HEIGHT = 3.5;
const WALL_THICKNESS = 0.15;

// Zone boundaries in % (matching FloorPlan.tsx zoneRegions)
const ZONES = [
  { name: 'MAIN_HALL',    x: 0,  z: 0,  w: 52, d: 72, floorColor: '#c4a67a', wallColor: '#f5efe6' },
  { name: 'TERRACE',      x: 54, z: 0,  w: 46, d: 72, floorColor: '#b8b0a0', wallColor: '#e8e4dc' },
  { name: 'PRIVATE_ROOM', x: 0,  z: 74, w: 100, d: 26, floorColor: '#b08860', wallColor: '#ebe5da' },
];

function pctToWorld(pctX: number, pctZ: number): [number, number] {
  return [
    (pctX / 100) * ROOM_WIDTH - ROOM_WIDTH / 2,
    (pctZ / 100) * ROOM_DEPTH - ROOM_DEPTH / 2,
  ];
}

export { pctToWorld, ROOM_WIDTH, ROOM_DEPTH, WALL_HEIGHT };

export default function Room() {
  return (
    <group>
      {/* Zone floors */}
      {ZONES.map((zone) => {
        const [x1, z1] = pctToWorld(zone.x, zone.z);
        const [x2, z2] = pctToWorld(zone.x + zone.w, zone.z + zone.d);
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        const w = Math.abs(x2 - x1);
        const d = Math.abs(z2 - z1);
        return (
          <mesh key={zone.name} position={[cx, 0.001, cz]} rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color={zone.floorColor} roughness={0.8} />
          </mesh>
        );
      })}

      {/* Outer walls */}
      {/* Back wall (z = -ROOM_DEPTH/2) */}
      <mesh position={[0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.9} />
      </mesh>
      {/* Front wall (z = +ROOM_DEPTH/2) */}
      <mesh position={[0, WALL_HEIGHT / 2, ROOM_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.9} />
      </mesh>
      {/* Left wall (x = -ROOM_WIDTH/2) */}
      <mesh position={[-ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.9} />
      </mesh>
      {/* Right wall (x = +ROOM_WIDTH/2) */}
      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.9} />
      </mesh>

      {/* Zone divider wall: main hall / terrace (vertical at x=53%) */}
      {(() => {
        const [wx] = pctToWorld(53, 0);
        const [, z1] = pctToWorld(0, 0);
        const [, z2] = pctToWorld(0, 72);
        const cz = (z1 + z2) / 2;
        const depth = Math.abs(z2 - z1);
        return (
          <mesh position={[wx, WALL_HEIGHT / 2, cz]} castShadow receiveShadow>
            <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, depth]} />
            <meshStandardMaterial color="#e8e0d4" roughness={0.9} />
          </mesh>
        );
      })()}

      {/* Zone divider wall: upper zones / private rooms (horizontal at z=73%) */}
      {(() => {
        const [, wz] = pctToWorld(0, 73);
        return (
          <mesh position={[0, WALL_HEIGHT / 2, wz]} castShadow receiveShadow>
            <boxGeometry args={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
            <meshStandardMaterial color="#e8e0d4" roughness={0.9} />
          </mesh>
        );
      })()}

      {/* Terrace: no ceiling — open sky indicated by lighter ambient */}
      {/* Main hall + private room ceiling */}
      {(() => {
        const [x1, z1] = pctToWorld(0, 0);
        const [x2, z2] = pctToWorld(52, 100);
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        const w = Math.abs(x2 - x1);
        const d = Math.abs(z2 - z1);
        return (
          <mesh position={[cx, WALL_HEIGHT, cz]} rotation-x={Math.PI / 2}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color="#faf5ee" side={THREE.DoubleSide} />
          </mesh>
        );
      })()}
    </group>
  );
}
```

- [ ] **Step 2: Add Room to FloorPlan3D**

Import Room and add `<Room />` to the Canvas, remove the temporary ground plane.

- [ ] **Step 3: Verify in browser**

Should see walls, zone floors with different wood tones, and ceiling over main hall.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/three/Room.tsx frontend/src/components/FloorPlan3D.tsx
git commit -m "feat: add 3D room with walls, zone floors, and ceiling"
```

---

### Task 4: Create Table3D component

**Files:**
- Create: `frontend/src/components/three/Table3D.tsx`
- Modify: `frontend/src/components/FloorPlan3D.tsx`

- [ ] **Step 1: Create Table3D with status colors and hover**

```tsx
import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { RestaurantTable } from '../../types';
import { pctToWorld } from './Room';
import * as THREE from 'three';

interface Props {
  table: RestaurantTable;
  status: 'available' | 'occupied' | 'recommended' | 'selected';
  isBest: boolean;
  onClick: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  available:   '#4a8c5c',
  occupied:    '#a04040',
  recommended: '#c8873a',
  selected:    '#1e5c3a',
};

const TABLE_LEG_COLOR = '#5a4030';

export default function Table3D({ table, status, isBest, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const [wx, wz] = pctToWorld(table.posX, table.posY);
  const isRound = table.seats <= 4;
  const radius = table.seats <= 2 ? 0.4 : table.seats <= 4 ? 0.5 : 0;
  const tableW = table.seats <= 6 ? 0.7 : 0.9;
  const tableD = table.seats <= 6 ? 0.5 : 0.6;
  const tableHeight = 0.75;
  const isClickable = status !== 'occupied';

  // Hover animation
  useFrame(() => {
    if (!groupRef.current) return;
    const targetY = hovered && isClickable ? 0.05 : 0;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
  });

  return (
    <group
      ref={groupRef}
      position={[wx, 0, wz]}
      onClick={(e) => { e.stopPropagation(); if (isClickable) onClick(); }}
      onPointerOver={() => { if (isClickable) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Table top */}
      {isRound ? (
        <mesh position={[0, tableHeight, 0]} castShadow>
          <cylinderGeometry args={[radius, radius, 0.05, 24]} />
          <meshStandardMaterial
            color={STATUS_COLORS[status]}
            emissive={hovered ? STATUS_COLORS[status] : '#000000'}
            emissiveIntensity={hovered ? 0.3 : 0}
            roughness={0.6}
          />
        </mesh>
      ) : (
        <mesh position={[0, tableHeight, 0]} castShadow>
          <boxGeometry args={[tableW, 0.05, tableD]} />
          <meshStandardMaterial
            color={STATUS_COLORS[status]}
            emissive={hovered ? STATUS_COLORS[status] : '#000000'}
            emissiveIntensity={hovered ? 0.3 : 0}
            roughness={0.6}
          />
        </mesh>
      )}

      {/* Central leg */}
      <mesh position={[0, tableHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, tableHeight, 8]} />
        <meshStandardMaterial color={TABLE_LEG_COLOR} roughness={0.7} />
      </mesh>

      {/* Table number label (floating above) */}
      {/* We'll use an HTML overlay via drei's Html component */}
    </group>
  );
}
```

- [ ] **Step 2: Add tables to FloorPlan3D scene**

In FloorPlan3D.tsx, compute table statuses (reuse logic from FloorPlan.tsx) and render `<Table3D>` for each table.

```tsx
import Table3D from './three/Table3D';

// Inside FloorPlan3D component, before the return:
const scoreMap = new Map(recommendations.map((r) => [r.table.id, r.score]));
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

function getTableStatus(table: RestaurantTable) {
  if (selectedTable?.id === table.id) return 'selected' as const;
  if (combinedMap.has(table.id) || singleRecommendedIds.has(table.id)) return 'recommended' as const;
  if (occupiedIds.has(table.id)) return 'occupied' as const;
  return 'available' as const;
}

// Inside Canvas, render tables:
{tables.map((table) => {
  const status = getTableStatus(table);
  const score = scoreMap.get(table.id);
  const isBest = score !== undefined && score === bestScore && hasSearched;
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
```

- [ ] **Step 3: Verify in browser**

Tables should appear as colored cylinders/boxes on the floor, with hover lift and cursor change.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/three/Table3D.tsx frontend/src/components/FloorPlan3D.tsx
git commit -m "feat: add 3D table markers with status colors and hover interaction"
```

---

### Task 5: Add Lighting and Furniture

**Files:**
- Create: `frontend/src/components/three/Lighting.tsx`
- Create: `frontend/src/components/three/Furniture.tsx`
- Modify: `frontend/src/components/FloorPlan3D.tsx`

- [ ] **Step 1: Create Lighting component**

```tsx
import { pctToWorld, WALL_HEIGHT } from './Room';

export default function Lighting() {
  // Window positions (from DataInitializer: left wall at x=0, divider at x=51, right wall at x=99)
  const windowPositions = [
    pctToWorld(0, 42),   // left wall, center
    pctToWorld(51, 42),  // divider wall
    pctToWorld(99, 40),  // right wall
  ];

  return (
    <group>
      <ambientLight intensity={0.4} color="#ffeedd" />
      <directionalLight
        position={[8, 12, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Window lights */}
      {windowPositions.map(([wx, wz], i) => (
        <pointLight
          key={i}
          position={[wx, WALL_HEIGHT * 0.7, wz]}
          intensity={0.4}
          color="#cce0ff"
          distance={8}
        />
      ))}
      {/* Hemisphere for sky fill */}
      <hemisphereLight args={['#87ceeb', '#8b7355', 0.3]} />
    </group>
  );
}
```

- [ ] **Step 2: Create Furniture component**

Renders bar, stage, kitchen based on floorElements data.

```tsx
import type { FloorElement } from '../../types';
import { pctToWorld } from './Room';

interface Props {
  elements: FloorElement[];
}

export default function Furniture({ elements }: Props) {
  return (
    <group>
      {elements.map((elem) => {
        const [cx, cz] = pctToWorld(
          elem.posX + elem.width / 2,
          elem.posY + elem.height / 2
        );
        const w = (elem.width / 100) * 20;
        const d = (elem.height / 100) * 15;

        switch (elem.type) {
          case 'stage':
            return (
              <mesh key={elem.id} position={[cx, 0.15, cz]} castShadow receiveShadow>
                <boxGeometry args={[w, 0.3, d]} />
                <meshStandardMaterial color="#5a3a2a" roughness={0.7} />
              </mesh>
            );
          case 'bar':
            return (
              <mesh key={elem.id} position={[cx, 0.55, cz]} castShadow receiveShadow>
                <boxGeometry args={[w, 1.1, d]} />
                <meshStandardMaterial color="#3a2a1a" roughness={0.5} metalness={0.1} />
              </mesh>
            );
          case 'kitchen':
            return (
              <mesh key={elem.id} position={[cx, 0.5, cz]} castShadow receiveShadow>
                <boxGeometry args={[w, 1.0, d]} />
                <meshStandardMaterial color="#888888" roughness={0.4} metalness={0.3} />
              </mesh>
            );
          default:
            return null;
        }
      })}
    </group>
  );
}
```

- [ ] **Step 3: Add to FloorPlan3D**

Replace inline lights with `<Lighting />` and add `<Furniture elements={floorElements} />`.

- [ ] **Step 4: Verify in browser**

Scene should have warm lighting, window light accents, and visible bar/stage/kitchen.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/three/Lighting.tsx frontend/src/components/three/Furniture.tsx frontend/src/components/FloorPlan3D.tsx
git commit -m "feat: add 3D lighting with window accents and furniture elements"
```

---

### Task 6: Create FloorPlanWrapper with 2D ⇄ 3D toggle

**Files:**
- Create: `frontend/src/components/FloorPlanWrapper.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Create FloorPlanWrapper**

```tsx
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

      {viewMode === '2d' ? (
        <FloorPlan {...props} />
      ) : (
        <FloorPlan3D {...props} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Remove h2 from FloorPlan.tsx**

The `<h2>Saali plaan</h2>` is now in FloorPlanWrapper, so remove it from FloorPlan.tsx.

- [ ] **Step 3: Add CSS for toggle**

```css
.floor-plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.view-toggle {
  display: flex;
  gap: 0;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.toggle-btn {
  padding: 6px 16px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--accent);
  color: white;
}

.toggle-btn:hover:not(.active) {
  background: rgba(42, 31, 20, 0.05);
}
```

- [ ] **Step 4: Update App.tsx**

Replace `<FloorPlan>` with `<FloorPlanWrapper>` in App.tsx. Import FloorPlanWrapper instead of FloorPlan. Remove the FloorPlan import.

- [ ] **Step 5: Verify toggle works**

Click 2D/3D buttons — should switch between existing floor plan and 3D scene.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/FloorPlanWrapper.tsx frontend/src/components/FloorPlan.tsx frontend/src/App.tsx frontend/src/App.css
git commit -m "feat: add 2D/3D toggle wrapper for floor plan views"
```

---

### Task 7: Add HTML labels to 3D tables (drei Html)

**Files:**
- Modify: `frontend/src/components/three/Table3D.tsx`

- [ ] **Step 1: Add floating table number label**

Import `Html` from `@react-three/drei` and add a floating label above each table:

```tsx
import { Html } from '@react-three/drei';

// Inside Table3D, after the table top mesh:
<Html
  position={[0, tableHeight + 0.3, 0]}
  center
  style={{
    pointerEvents: 'none',
    userSelect: 'none',
    fontSize: '11px',
    fontWeight: 600,
    color: '#2a1f14',
    background: 'rgba(255,255,255,0.85)',
    padding: '2px 6px',
    borderRadius: '6px',
    border: `1.5px solid ${STATUS_COLORS[status]}`,
    whiteSpace: 'nowrap',
  }}
>
  {table.tableNumber} · {table.seats}
</Html>
```

- [ ] **Step 2: Verify labels visible**

Each table should show its number and seat count floating above.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/three/Table3D.tsx
git commit -m "feat: add floating HTML labels to 3D tables"
```

---

### Task 8: Admin 3D preview toggle

**Files:**
- Create: `frontend/src/components/AdminFloorPlanWrapper.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Create AdminFloorPlanWrapper**

```tsx
import { useState } from 'react';
import AdminFloorPlan from './AdminFloorPlan';
import FloorPlan3D from './FloorPlan3D';
import type { RestaurantTable, FloorElement } from '../types';

interface Props {
  tables: RestaurantTable[];
  floorElements: FloorElement[];
  onTablesChange: () => void;
  onElementsChange: () => void;
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
```

- [ ] **Step 2: Add CSS**

```css
.admin-preview-toggle {
  display: flex;
  gap: 0;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  width: fit-content;
}
```

- [ ] **Step 3: Update App.tsx**

Replace `<AdminFloorPlan>` with `<AdminFloorPlanWrapper>` in the admin tab section.

- [ ] **Step 4: Verify admin toggle**

Switch to Admin tab, click "3D Eelvaade" — should see 3D room. Click "Redigeerimine" — back to 2D admin.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AdminFloorPlanWrapper.tsx frontend/src/App.tsx frontend/src/App.css
git commit -m "feat: add 3D preview toggle to admin panel"
```

---

### Task 9: Polish and final touches

**Files:**
- Modify: `frontend/src/components/FloorPlan3D.tsx`
- Modify: `frontend/src/components/three/Table3D.tsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Add loading fallback**

Wrap FloorPlan3D Canvas in Suspense with a loading indicator:

```tsx
import { Suspense } from 'react';

// Wrap Canvas contents:
<Canvas ...>
  <Suspense fallback={null}>
    <Room />
    <Lighting />
    {/* tables */}
    <Furniture elements={floorElements} />
  </Suspense>
  <OrbitControls ... />
</Canvas>
```

- [ ] **Step 2: Add best-table pulse animation**

In Table3D, add a subtle scale pulse for `isBest`:

```tsx
useFrame((_, delta) => {
  if (!groupRef.current) return;
  const targetY = hovered && isClickable ? 0.05 : 0;
  groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;

  if (isBest) {
    const t = performance.now() * 0.002;
    groupRef.current.scale.setScalar(1 + Math.sin(t) * 0.04);
  } else {
    groupRef.current.scale.setScalar(1);
  }
});
```

- [ ] **Step 3: Add grid helper for orientation**

```tsx
<gridHelper args={[ROOM_WIDTH, 20, '#ddd', '#eee']} position={[0, 0.002, 0]} />
```

- [ ] **Step 4: Test full flow**

1. Open booking view → default 2D
2. Toggle to 3D → see room with tables
3. Search for table → tables change color
4. Click table → modal opens
5. Toggle back to 2D → same state
6. Admin tab → 2D editor
7. Admin "3D Eelvaade" → read-only 3D

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "feat: polish 3D floor plan with loading, animations, and grid"
git push origin feature/3d-floor-plan
```
