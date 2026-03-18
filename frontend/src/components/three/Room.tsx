import * as THREE from 'three';

export const ROOM_WIDTH = 20;
export const ROOM_DEPTH = 15;
export const WALL_HEIGHT = 3.5;

const WALL_THICKNESS = 0.15;
const WALL_COLOR = '#f5efe6';

/** Maps percentage coordinates (0-100) to Three.js world coordinates. */
export function pctToWorld(pctX: number, pctY: number): [number, number] {
  const worldX = (pctX / 100) * ROOM_WIDTH - ROOM_WIDTH / 2;
  const worldZ = (pctY / 100) * ROOM_DEPTH - ROOM_DEPTH / 2;
  return [worldX, worldZ];
}

interface ZoneDef {
  x1: number; x2: number; y1: number; y2: number;
  color: string;
}

const ZONES: ZoneDef[] = [
  { x1: 0, x2: 52, y1: 0, y2: 72, color: '#c4a67a' },   // MAIN_HALL
  { x1: 54, x2: 100, y1: 0, y2: 72, color: '#b8b0a0' },  // TERRACE
  { x1: 0, x2: 100, y1: 74, y2: 100, color: '#b08860' },  // PRIVATE_ROOM
];

function ZoneFloor({ zone }: { zone: ZoneDef }) {
  const [x1, z1] = pctToWorld(zone.x1, zone.y1);
  const [x2, z2] = pctToWorld(zone.x2, zone.y2);
  const w = x2 - x1;
  const d = z2 - z1;
  const cx = x1 + w / 2;
  const cz = z1 + d / 2;

  return (
    <mesh position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={zone.color} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Wall({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={WALL_COLOR} />
    </mesh>
  );
}

export default function Room() {
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const halfH = WALL_HEIGHT / 2;

  // Divider wall positions in world coords
  const [dividerX] = pctToWorld(53, 0);
  const [, dividerZ] = pctToWorld(0, 73);

  // Ceiling covers main hall (x: 0-52%) and private rooms (x: 0-100%, y: 74-100%)
  // Main hall ceiling
  const [mhX1] = pctToWorld(0, 0);
  const [mhX2] = pctToWorld(52, 0);
  const [, mhZ1] = pctToWorld(0, 0);
  const [, mhZ2] = pctToWorld(0, 72);
  const mhCeilW = mhX2 - mhX1;
  const mhCeilD = mhZ2 - mhZ1;

  // Private room ceiling
  const [prX1] = pctToWorld(0, 0);
  const [prX2] = pctToWorld(100, 0);
  const [, prZ1] = pctToWorld(0, 74);
  const [, prZ2] = pctToWorld(0, 100);
  const prCeilW = prX2 - prX1;
  const prCeilD = prZ2 - prZ1;

  return (
    <group>
      {/* Zone floors */}
      {ZONES.map((z, i) => (
        <ZoneFloor key={i} zone={z} />
      ))}

      {/* Outer walls */}
      {/* Front wall (z = -halfD) */}
      <Wall position={[0, halfH, -halfD]} size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
      {/* Back wall (z = +halfD) */}
      <Wall position={[0, halfH, halfD]} size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
      {/* Left wall (x = -halfW) */}
      <Wall position={[-halfW, halfH, 0]} size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
      {/* Right wall (x = +halfW) */}
      <Wall position={[halfW, halfH, 0]} size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />

      {/* Zone divider: main hall | terrace (vertical, at x=53%) */}
      <Wall
        position={[dividerX, halfH, (mhZ1 + mhZ2) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, mhCeilD]}
      />

      {/* Zone divider: upper zones | private rooms (horizontal, at y=73%) */}
      <Wall
        position={[0, halfH, dividerZ]}
        size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* Ceiling - main hall only */}
      <mesh
        position={[mhX1 + mhCeilW / 2, WALL_HEIGHT, mhZ1 + mhCeilD / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[mhCeilW, mhCeilD]} />
        <meshStandardMaterial color="#f0ead8" side={THREE.DoubleSide} />
      </mesh>

      {/* Ceiling - private rooms */}
      <mesh
        position={[prX1 + prCeilW / 2, WALL_HEIGHT, prZ1 + prCeilD / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[prCeilW, prCeilD]} />
        <meshStandardMaterial color="#f0ead8" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
