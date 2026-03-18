import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { RestaurantTable } from '../../types';
import { pctToWorld } from './Room';

type TableStatus = 'available' | 'occupied' | 'recommended' | 'selected';

interface Props {
  table: RestaurantTable;
  status: TableStatus;
  isBest: boolean;
  onClick: () => void;
}

const STATUS_COLORS: Record<TableStatus, string> = {
  available: '#4a8c5c',
  occupied: '#a04040',
  recommended: '#c8873a',
  selected: '#1e5c3a',
};

const TABLE_HEIGHT = 0.75;
const LEG_RADIUS = 0.06;

function getTableDimensions(seats: number): { isRound: boolean; radius: number; width: number; depth: number } {
  if (seats <= 2) return { isRound: true, radius: 0.4, width: 0, depth: 0 };
  if (seats <= 4) return { isRound: true, radius: 0.5, width: 0, depth: 0 };
  if (seats <= 6) return { isRound: false, radius: 0, width: 0.7, depth: 0.5 };
  return { isRound: false, radius: 0, width: 0.9, depth: 0.6 };
}

export default function Table3D({ table, status, isBest, onClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetY = useRef(0);

  const [worldX, worldZ] = pctToWorld(table.posX, table.posY);
  const dims = getTableDimensions(table.seats);
  const color = STATUS_COLORS[status];
  const isClickable = status !== 'occupied';

  useFrame(() => {
    if (!groupRef.current) return;
    const goal = hovered && isClickable ? 0.05 : 0;
    targetY.current += (goal - targetY.current) * 0.1;
    groupRef.current.position.y = targetY.current;
  });

  const handlePointerOver = () => {
    if (isClickable) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = () => {
    if (isClickable) onClick();
  };

  const emissiveIntensity = hovered && isClickable ? 0.3 : 0;

  return (
    <group ref={groupRef} position={[worldX, 0, worldZ]}>
      {/* Table top */}
      {dims.isRound ? (
        <mesh position={[0, TABLE_HEIGHT, 0]} castShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <cylinderGeometry args={[dims.radius, dims.radius, 0.05, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ) : (
        <mesh position={[0, TABLE_HEIGHT, 0]} castShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <boxGeometry args={[dims.width, 0.05, dims.depth]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}

      {/* Central leg */}
      <mesh position={[0, TABLE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[LEG_RADIUS, LEG_RADIUS, TABLE_HEIGHT, 8]} />
        <meshStandardMaterial color="#5a4a3a" />
      </mesh>

      {/* Floating label */}
      <Html position={[0, TABLE_HEIGHT + 0.5, 0]} center distanceFactor={10}>
        <div
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            border: isBest ? '1px solid #ffd700' : 'none',
          }}
        >
          {table.tableNumber} &middot; {table.seats}
        </div>
      </Html>
    </group>
  );
}
