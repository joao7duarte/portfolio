import { RoundedBox } from '@react-three/drei'

const W = 0.42
const H = 1.0
const D = 0.9

/** PC tower that stands on the floor under the desk. Built facing +z: front panel, glass side on +x. */
export function Tower({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const glow = <meshStandardMaterial color="#4caf50" emissive="#4caf50" emissiveIntensity={1.4} toneMapped={false} />
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* case */}
      <RoundedBox args={[W, H, D]} radius={0.025} smoothness={3} position={[0, H / 2 + 0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1c1a19" roughness={0.55} metalness={0.2} />
      </RoundedBox>
      {/* feet */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.05), 0.015, sz * (D / 2 - 0.08)]}>
            <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
            <meshStandardMaterial color="#0e0d0c" roughness={0.8} />
          </mesh>
        )),
      )}
      {/* front panel: mesh grille, light strip and power button */}
      <mesh position={[0, H / 2 + 0.06, D / 2 + 0.002]}>
        <planeGeometry args={[W - 0.1, H - 0.2]} />
        <meshStandardMaterial color="#2a2725" roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2 + 0.035, H / 2 + 0.03, D / 2 + 0.004]}>
        <planeGeometry args={[0.012, H - 0.12]} />
        {glow}
      </mesh>
      <mesh position={[0, H - 0.04, D / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.008, 16]} />
        {glow}
      </mesh>
      {/* glass side panel with the parts glowing behind it */}
      <mesh position={[W / 2 + 0.002, H / 2 + 0.03, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D - 0.12, H - 0.12]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.15} metalness={0.4} />
      </mesh>
      {/* fans seen through the glass */}
      {[0.22, -0.18].map((y) => (
        <mesh key={y} position={[W / 2 + 0.004, H / 2 + 0.03 + y, D / 2 - 0.2]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.07, 0.085, 32]} />
          {glow}
        </mesh>
      ))}
      {/* graphics card */}
      <mesh position={[W / 2 + 0.004, H / 2 - 0.08, -0.08]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.46, 0.08]} />
        <meshStandardMaterial color="#3a3633" roughness={0.6} />
      </mesh>
    </group>
  )
}
