import { useEffect, useLayoutEffect, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, Mesh, MeshStandardMaterial, Object3D, SpotLight } from 'three'
import { useReducedMotion } from './CameraRig'
import { Chair } from './Chair'
import { DESK_TOP, DESK_WIDTH } from './dims'
import { ACCENT, FLOOR, GRAPHITE, PAPER, PLASTER, WALNUT } from './palette'
import { useArtTexture, useRugTexture } from './textures'

const WALL_X = 6.5
const WALL_Z = -1.4

const LAMP_POS: [number, number, number] = [1.4, DESK_TOP, -0.55]
const LAMP_TILT = -0.7
const LAMP_INTENSITY = 3.2
const SHADE_GLOW = 0.55
const DIM_MS = 2000

/**
 * Cozy evening room: plaster walls on three sides, rug, desk, lamp and quiet props.
 * Nothing here is clickable: raycasting is switched off so props never block the menu objects.
 */
export function Room({ lampDimId }: { lampDimId: number }) {
  const root = useRef<Group>(null)
  useLayoutEffect(() => {
    root.current?.traverse((o) => {
      if ((o as Mesh).isMesh) o.raycast = () => {}
    })
  }, [])

  return (
    <group ref={root}>
      <Shell />
      <Rug />
      <Desk />
      <Lamp dimId={lampDimId} />
      {/* pushed back and swiveled out, as if someone just got up; to the camera's left of the desk so it hides nothing */}
      <Chair position={[-2.15, 0, 1.55]} rotation={1.2} />
      <Books position={[1.0, DESK_TOP, -0.22]} />
      <Plant position={[2.4, 0, -0.65]} />
      <Shelf position={[3.0, DESK_TOP + 0.9, WALL_Z]} />
      <Frame position={[1.7, DESK_TOP + 1.5, WALL_Z]} />
    </group>
  )
}

function Shell() {
  const wall = <meshStandardMaterial color={PLASTER} roughness={1} />
  return (
    <group>
      {/* floor is far larger than any view so no void shows at the edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 10]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={FLOOR} roughness={0.95} />
      </mesh>
      <mesh position={[0, 4, WALL_Z]} receiveShadow>
        <planeGeometry args={[2 * WALL_X, 8]} />
        {wall}
      </mesh>
      <mesh position={[-WALL_X, 4, 10]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        {wall}
      </mesh>
      <mesh position={[WALL_X, 4, 10]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        {wall}
      </mesh>
      {/* skirting */}
      <mesh position={[0, 0.07, WALL_Z + 0.015]}>
        <boxGeometry args={[2 * WALL_X, 0.14, 0.03]} />
        <meshStandardMaterial color="#f4ecdc" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Rug() {
  const map = useRugTexture()
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.6]} receiveShadow>
      <planeGeometry args={[4.4, 3.15]} />
      <meshStandardMaterial map={map} alphaTest={0.5} roughness={1} />
    </mesh>
  )
}

function Desk() {
  const legs: [number, number][] = [
    [-1.55, -0.55],
    [1.55, -0.55],
    [-1.55, 0.55],
    [1.55, 0.55],
  ]
  return (
    <group>
      <RoundedBox args={[DESK_WIDTH, 0.06, 1.4]} radius={0.02} smoothness={3} position={[0, DESK_TOP - 0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WALNUT} roughness={0.7} />
      </RoundedBox>
      {legs.map(([x, z]) => (
        <RoundedBox key={`${x}${z}`} args={[0.08, DESK_TOP - 0.06, 0.08]} radius={0.014} smoothness={2} position={[x, (DESK_TOP - 0.06) / 2, z]} castShadow receiveShadow>
          <meshStandardMaterial color="#6f4630" roughness={0.7} />
        </RoundedBox>
      ))}
      <mesh position={[0, DESK_TOP * 0.7, -0.55]} castShadow>
        <boxGeometry args={[3.1, 0.04, 0.03]} />
        <meshStandardMaterial color="#6f4630" roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Desk lamp with a real warm spot light that makes a soft pool on the desk. No shadow map, so it stays cheap. */
function Lamp({ dimId }: { dimId: number }) {
  const spot = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)
  const shade = useRef<MeshStandardMaterial>(null)
  const dimStart = useRef<number | null>(null)
  const invalidate = useThree((s) => s.invalidate)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])
  useEffect(() => {
    if (dimId > 0 && !reduced) {
      dimStart.current = performance.now()
      invalidate()
    }
  }, [dimId, reduced, invalidate])
  // the lamp fades down and back up once
  useFrame((state) => {
    if (dimStart.current === null) return
    const p = Math.min(1, (performance.now() - dimStart.current) / DIM_MS)
    const light = 1 - 0.85 * Math.sin(p * Math.PI)
    if (spot.current) spot.current.intensity = LAMP_INTENSITY * light
    if (shade.current) shade.current.emissiveIntensity = SHADE_GLOW * light
    if (p >= 1) dimStart.current = null
    state.invalidate()
  })
  const metal = <meshStandardMaterial color={GRAPHITE} roughness={0.45} metalness={0.3} />
  return (
    <group>
      <group position={LAMP_POS}>
        <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.11, 0.02, 32]} />
          {metal}
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 12]} />
          {metal}
        </mesh>
        <group position={[0, 0.43, 0]} rotation={[0, 0, LAMP_TILT]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 12]} />
            {metal}
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.035, 0.09, 0.15, 32, 1, true]} />
            <meshStandardMaterial ref={shade} color="#f0dcb8" emissive="#ffb766" emissiveIntensity={SHADE_GLOW} roughness={0.8} side={2} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.028, 16, 12]} />
            <meshBasicMaterial color="#ffe2b0" toneMapped={false} />
          </mesh>
        </group>
      </group>
      <spotLight
        ref={spot}
        position={[LAMP_POS[0] + 0.08, DESK_TOP + 0.52, LAMP_POS[2]]}
        color="#ffb35e"
        intensity={LAMP_INTENSITY}
        angle={0.85}
        penumbra={1}
        decay={2}
      />
      <object3D ref={target} position={[0.9, DESK_TOP, -0.05]} />
    </group>
  )
}

function Books({ position }: { position: [number, number, number] }) {
  const books: { size: [number, number, number]; color: string; rot: number; y: number }[] = [
    { size: [0.3, 0.045, 0.21], color: ACCENT, rot: 0.08, y: 0.0225 },
    { size: [0.27, 0.035, 0.2], color: '#c9714f', rot: -0.12, y: 0.0625 },
    { size: [0.25, 0.04, 0.19], color: '#eee3cf', rot: 0.2, y: 0.1 },
  ]
  return (
    <group position={position}>
      {books.map((b, i) => (
        <RoundedBox key={i} args={b.size} radius={0.005} smoothness={2} position={[0, b.y, 0]} rotation={[0, b.rot, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={b.color} roughness={0.85} />
        </RoundedBox>
      ))}
    </group>
  )
}

function Plant({ position }: { position: [number, number, number] }) {
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2
    const lean = 0.35 + (i % 3) * 0.18
    return { a, lean, h: 0.55 + (i % 3) * 0.14, c: i % 2 ? '#2f7a5f' : ACCENT }
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.19, 0.4, 28]} />
        <meshStandardMaterial color="#b9714f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.24, 28]} />
        <meshStandardMaterial color="#3a2a20" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.4, 0]} rotation={[0, l.a, l.lean]}>
          <mesh position={[0, l.h / 2, 0]} scale={[0.07, l.h / 2, 0.025]} castShadow>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color={l.c} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Shelf({ position }: { position: [number, number, number] }) {
  const books: { x: number; h: number; w: number; c: string }[] = [
    { x: -0.5, h: 0.26, w: 0.05, c: ACCENT },
    { x: -0.44, h: 0.22, w: 0.045, c: '#c9714f' },
    { x: -0.385, h: 0.28, w: 0.055, c: '#eee3cf' },
  ]
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.11]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.04, 0.22]} />
        <meshStandardMaterial color={WALNUT} roughness={0.7} />
      </mesh>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, 0.02 + b.h / 2, 0.11]} castShadow>
          <boxGeometry args={[b.w, b.h, 0.16]} />
          <meshStandardMaterial color={b.c} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0.3, 0.1, 0.11]} castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.2, 20]} />
        <meshStandardMaterial color="#eee3cf" roughness={0.6} />
      </mesh>
      <mesh position={[0.3, 0.27, 0.11]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.25, 6]} />
        <meshStandardMaterial color={ACCENT} />
      </mesh>
      <mesh position={[0.34, 0.25, 0.11]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.22, 6]} />
        <meshStandardMaterial color="#2f7a5f" />
      </mesh>
    </group>
  )
}

function Frame({ position }: { position: [number, number, number] }) {
  const art = useArtTexture()
  return (
    <group position={position}>
      <RoundedBox args={[0.76, 0.58, 0.03]} radius={0.008} smoothness={2} position={[0, 0, 0.015]} castShadow receiveShadow>
        <meshStandardMaterial color={WALNUT} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[0.66, 0.48]} />
        <meshStandardMaterial color={PAPER} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[0.5, 0.375]} />
        <meshStandardMaterial map={art} roughness={0.9} />
      </mesh>
    </group>
  )
}
