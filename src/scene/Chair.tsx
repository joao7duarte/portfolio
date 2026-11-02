import { RoundedBox } from '@react-three/drei'
import { ACCENT, GRAPHITE } from './palette'

const LEGS = 5
const LEG_LEN = 0.72
const CASTER_R = 0.075
const BASE_Y = 0.18
const SEAT_Y = 1

/**
 * Swivel office chair, built facing +z. Proportioned against the desk, whose top is at 1.7 and width 3.4:
 * the seat top is about 2/3 of the desk height and the backrest rises well above the desk top.
 */
export function Chair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const frame = <meshStandardMaterial color={GRAPHITE} roughness={0.45} metalness={0.3} />
  const cushion = <meshStandardMaterial color={ACCENT} roughness={0.9} />
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* star base with casters */}
      {Array.from({ length: LEGS }, (_, i) => (
        <group key={i} rotation={[0, (i / LEGS) * Math.PI * 2, 0]}>
          <mesh position={[0, BASE_Y, LEG_LEN / 2]} castShadow>
            <boxGeometry args={[0.1, 0.06, LEG_LEN]} />
            {frame}
          </mesh>
          <mesh position={[0, CASTER_R, LEG_LEN - 0.02]} castShadow>
            <sphereGeometry args={[CASTER_R, 14, 10]} />
            {frame}
          </mesh>
        </group>
      ))}
      {/* gas lift */}
      <mesh position={[0, (BASE_Y + SEAT_Y) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, SEAT_Y - BASE_Y, 16]} />
        {frame}
      </mesh>
      {/* seat */}
      <RoundedBox args={[1.2, 0.18, 1.12]} radius={0.08} smoothness={4} position={[0, SEAT_Y + 0.07, 0.03]} castShadow receiveShadow>
        {cushion}
      </RoundedBox>
      {/* back support and backrest, reclined a little */}
      <group position={[0, SEAT_Y, -0.54]} rotation={[-0.14, 0, 0]}>
        <mesh position={[0, 0.25, -0.03]} castShadow>
          <boxGeometry args={[0.16, 0.6, 0.05]} />
          {frame}
        </mesh>
        <RoundedBox args={[1.1, 0.86, 0.14]} radius={0.07} smoothness={4} position={[0, 0.7, 0.03]} castShadow receiveShadow>
          {cushion}
        </RoundedBox>
      </group>
      {/* armrests */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.66, SEAT_Y, 0.02]}>
          <mesh position={[0, 0.21, 0]} castShadow>
            <boxGeometry args={[0.07, 0.42, 0.1]} />
            {frame}
          </mesh>
          <RoundedBox args={[0.14, 0.06, 0.58]} radius={0.025} smoothness={2} position={[0, 0.44, 0.03]} castShadow>
            {frame}
          </RoundedBox>
        </group>
      ))}
    </group>
  )
}
