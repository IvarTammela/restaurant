import type { FloorElement } from '../../types';
import { pctToWorld, ROOM_WIDTH, ROOM_DEPTH } from './Room';

interface Props {
  elements: FloorElement[];
}

interface FurnitureDef {
  height: number;
  color: string;
  metalness?: number;
}

const FURNITURE_DEFS: Record<string, FurnitureDef> = {
  stage: { height: 0.3, color: '#5a3a2a' },
  bar: { height: 1.1, color: '#3a2a1a', metalness: 0.1 },
  kitchen: { height: 1.0, color: '#888888', metalness: 0.3 },
};

function FurnitureItem({ element }: { element: FloorElement }) {
  const def = FURNITURE_DEFS[element.type];
  if (!def) return null;

  const [worldX, worldZ] = pctToWorld(element.posX, element.posY);
  const worldW = (element.width / 100) * ROOM_WIDTH;
  const worldD = (element.height / 100) * ROOM_DEPTH;

  const rotY = element.rotation ? (element.rotation * Math.PI) / 180 : 0;

  return (
    <mesh
      position={[worldX, def.height / 2, worldZ]}
      rotation={[0, rotY, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[worldW, def.height, worldD]} />
      <meshStandardMaterial
        color={def.color}
        metalness={def.metalness ?? 0}
        roughness={0.7}
      />
    </mesh>
  );
}

export default function Furniture({ elements }: Props) {
  return (
    <group>
      {elements.map((el) => (
        <FurnitureItem key={el.id} element={el} />
      ))}
    </group>
  );
}
