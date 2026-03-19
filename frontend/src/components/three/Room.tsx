import * as THREE from 'three';

export const ROOM_WIDTH = 20;
export const ROOM_DEPTH = 15;
export const WALL_HEIGHT = 3.5;

const WALL_THICKNESS = 0.15;
const WALL_COLOR = '#f5efe6';
const GLASS_COLOR = '#a8d4f0';
const DOOR_HEIGHT = 2.6;

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
    <mesh position={[cx, 0.001, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={zone.color} roughness={0.85} />
    </mesh>
  );
}

/** Solid wall segment */
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
      <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
    </mesh>
  );
}

/** Glass window panel */
function WindowPanel({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={GLASS_COLOR}
        transparent
        opacity={0.25}
        roughness={0.05}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Builds wall segments along one axis, with gaps for doors and windows.
 * Windows get a glass panel; doors get an empty opening.
 */
function WallWithOpenings({
  axis,
  fixedPos,
  rangeStart,
  rangeEnd,
  openings,
}: {
  axis: 'x' | 'z';
  fixedPos: number;        // Fixed coordinate (x for z-walls, z for x-walls)
  rangeStart: number;      // Start of wall in variable axis
  rangeEnd: number;        // End of wall in variable axis
  openings: Array<{
    start: number;         // % position start
    end: number;           // % position end
    type: 'door' | 'window';
  }>;
}) {
  const segments: JSX.Element[] = [];
  const halfH = WALL_HEIGHT / 2;

  // Convert openings from % to world coords and sort
  const worldOpenings = openings.map((o) => {
    if (axis === 'z') {
      // Wall runs along Z, fixed X
      const [, s] = pctToWorld(0, o.start);
      const [, e] = pctToWorld(0, o.end);
      return { start: Math.min(s, e), end: Math.max(s, e), type: o.type };
    } else {
      // Wall runs along X, fixed Z
      const [s] = pctToWorld(o.start, 0);
      const [e] = pctToWorld(o.end, 0);
      return { start: Math.min(s, e), end: Math.max(s, e), type: o.type };
    }
  }).sort((a, b) => a.start - b.start);

  let cursor = rangeStart;

  worldOpenings.forEach((op, i) => {
    // Solid segment before this opening
    if (cursor < op.start - 0.01) {
      const len = op.start - cursor;
      const mid = cursor + len / 2;
      const pos: [number, number, number] = axis === 'z'
        ? [fixedPos, halfH, mid]
        : [mid, halfH, fixedPos];
      const size: [number, number, number] = axis === 'z'
        ? [WALL_THICKNESS, WALL_HEIGHT, len]
        : [len, WALL_HEIGHT, WALL_THICKNESS];
      segments.push(<Wall key={`s${i}`} position={pos} size={size} />);
    }

    // The opening itself
    const openLen = op.end - op.start;
    const openMid = op.start + openLen / 2;

    if (op.type === 'window') {
      // Wall below window
      const windowBottom = 1.0;
      const windowTop = WALL_HEIGHT - 0.4;
      const windowH = windowTop - windowBottom;

      // Wall segment below window
      const belowPos: [number, number, number] = axis === 'z'
        ? [fixedPos, windowBottom / 2, openMid]
        : [openMid, windowBottom / 2, fixedPos];
      const belowSize: [number, number, number] = axis === 'z'
        ? [WALL_THICKNESS, windowBottom, openLen]
        : [openLen, windowBottom, WALL_THICKNESS];
      segments.push(<Wall key={`wb${i}`} position={belowPos} size={belowSize} />);

      // Wall segment above window
      const aboveH = WALL_HEIGHT - windowTop;
      const abovePos: [number, number, number] = axis === 'z'
        ? [fixedPos, windowTop + aboveH / 2, openMid]
        : [openMid, windowTop + aboveH / 2, fixedPos];
      const aboveSize: [number, number, number] = axis === 'z'
        ? [WALL_THICKNESS, aboveH, openLen]
        : [openLen, aboveH, WALL_THICKNESS];
      segments.push(<Wall key={`wa${i}`} position={abovePos} size={aboveSize} />);

      // Glass panel
      const glassPos: [number, number, number] = axis === 'z'
        ? [fixedPos, windowBottom + windowH / 2, openMid]
        : [openMid, windowBottom + windowH / 2, fixedPos];
      const glassSize: [number, number, number] = axis === 'z'
        ? [0.03, windowH, openLen]
        : [openLen, windowH, 0.03];
      segments.push(<WindowPanel key={`g${i}`} position={glassPos} size={glassSize} />);
    } else {
      // Door: wall above doorframe
      const aboveH = WALL_HEIGHT - DOOR_HEIGHT;
      const abovePos: [number, number, number] = axis === 'z'
        ? [fixedPos, DOOR_HEIGHT + aboveH / 2, openMid]
        : [openMid, DOOR_HEIGHT + aboveH / 2, fixedPos];
      const aboveSize: [number, number, number] = axis === 'z'
        ? [WALL_THICKNESS, aboveH, openLen]
        : [openLen, aboveH, WALL_THICKNESS];
      segments.push(<Wall key={`da${i}`} position={abovePos} size={aboveSize} />);
    }

    cursor = op.end;
  });

  // Final solid segment after last opening
  if (cursor < rangeEnd - 0.01) {
    const len = rangeEnd - cursor;
    const mid = cursor + len / 2;
    const pos: [number, number, number] = axis === 'z'
      ? [fixedPos, halfH, mid]
      : [mid, halfH, fixedPos];
    const size: [number, number, number] = axis === 'z'
      ? [WALL_THICKNESS, WALL_HEIGHT, len]
      : [len, WALL_HEIGHT, WALL_THICKNESS];
    segments.push(<Wall key="send" position={pos} size={size} />);
  }

  return <group>{segments}</group>;
}

export default function Room() {
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const halfH = WALL_HEIGHT / 2;

  // Divider wall positions
  const [dividerX] = pctToWorld(53, 0);
  const [, dividerZ] = pctToWorld(0, 73);

  // Zone boundaries for ceilings
  const [mhX1] = pctToWorld(0, 0);
  const [mhX2] = pctToWorld(52, 0);
  const [, mhZ1] = pctToWorld(0, 0);
  const [, mhZ2] = pctToWorld(0, 72);
  const mhCeilW = mhX2 - mhX1;
  const mhCeilD = mhZ2 - mhZ1;

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

      {/* === Left wall (x = -halfW) — "Vaade tänavale" windows at y=25-60% === */}
      <WallWithOpenings
        axis="z"
        fixedPos={-halfW}
        rangeStart={-halfD}
        rangeEnd={halfD}
        openings={[
          { start: 25, end: 55, type: 'window' },
        ]}
      />

      {/* === Right wall (x = +halfW) — "Vaade terrassile" windows at y=15-65% === */}
      <WallWithOpenings
        axis="z"
        fixedPos={halfW}
        rangeStart={-halfD}
        rangeEnd={halfD}
        openings={[
          { start: 15, end: 60, type: 'window' },
        ]}
      />

      {/* === Front wall (z = -halfD) — no openings === */}
      <Wall position={[0, halfH, -halfD]} size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />

      {/* === Back wall (z = +halfD) — door "Välisuks" at x=22-30% === */}
      <WallWithOpenings
        axis="x"
        fixedPos={halfD}
        rangeStart={-halfW}
        rangeEnd={halfW}
        openings={[
          { start: 22, end: 30, type: 'door' },
        ]}
      />

      {/* === Divider: main hall | terrace (x=53%) — "Uks terrassile" + "Vaade sisehoovi" window === */}
      <WallWithOpenings
        axis="z"
        fixedPos={dividerX}
        rangeStart={mhZ1}
        rangeEnd={mhZ2}
        openings={[
          { start: 25, end: 55, type: 'window' },
          { start: 62, end: 68, type: 'door' },
        ]}
      />

      {/* === Divider: upper zones | private rooms (z=73%) — door at x=20-28% === */}
      <WallWithOpenings
        axis="x"
        fixedPos={dividerZ}
        rangeStart={-halfW}
        rangeEnd={halfW}
        openings={[
          { start: 20, end: 28, type: 'door' },
        ]}
      />

      {/* === Ceilings — only visible from BELOW (BackSide) so orbital camera sees into room === */}
      <mesh
        position={[mhX1 + mhCeilW / 2, WALL_HEIGHT, mhZ1 + mhCeilD / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[mhCeilW, mhCeilD]} />
        <meshStandardMaterial color="#f0ead8" side={THREE.BackSide} />
      </mesh>

      <mesh
        position={[prX1 + prCeilW / 2, WALL_HEIGHT, prZ1 + prCeilD / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[prCeilW, prCeilD]} />
        <meshStandardMaterial color="#f0ead8" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
