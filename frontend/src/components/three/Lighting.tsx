import { pctToWorld, WALL_HEIGHT } from './Room';

export default function Lighting() {
  // Window positions in world coordinates
  const [wx1, wz1] = pctToWorld(0, 42);
  const [wx2, wz2] = pctToWorld(51, 42);
  const [wx3, wz3] = pctToWorld(99, 40);
  const windowY = WALL_HEIGHT * 0.7;

  return (
    <>
      <ambientLight intensity={0.4} color="#ffeedd" />

      <directionalLight
        intensity={0.8}
        position={[8, 12, 5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <hemisphereLight
        args={['#87ceeb', '#8b7355', 0.3]}
      />

      {/* Window point lights */}
      <pointLight position={[wx1, windowY, wz1]} color="#cce0ff" intensity={0.4} />
      <pointLight position={[wx2, windowY, wz2]} color="#cce0ff" intensity={0.4} />
      <pointLight position={[wx3, windowY, wz3]} color="#cce0ff" intensity={0.4} />
    </>
  );
}
