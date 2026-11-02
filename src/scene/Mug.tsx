import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { SIPS_PER_CUP, type Coffee } from '../lib/useCoffee'
import { useReducedMotion } from './CameraRig'
import { Interactive } from './Interactive'
import { ACCENT, PAPER } from './palette'

const R = 0.16
const H = 0.35
const SURFACE_LOW = 0.02
const SURFACE_HIGH = H - 0.04
const SIP_MS = 800
const STEAM_MS = 1800
const STEAM_PUFFS = [
  { x: -0.05, z: 0.02, delay: 0 },
  { x: 0.04, z: -0.03, delay: 0.15 },
  { x: 0, z: 0.05, delay: 0.3 },
]

type Props = {
  position: [number, number, number]
  enabled: boolean
  coffee: Coffee
  onClick: () => void
}

/** Sized against the keyboard (44cm, 1.575 wide): a 9cm x 10cm mug is about 0.32 wide and 0.35 tall. */
export function Mug({ position, enabled, coffee, onClick }: Props) {
  const { level, sipId, refillId } = coffee
  const invalidate = useThree((s) => s.invalidate)
  const reduced = useReducedMotion()

  const body = useRef<Group>(null)
  const surface = useRef<Mesh>(null)
  const steam = useRef<Group>(null)
  const puffs = useRef<(MeshBasicMaterial | null)[]>([])
  const sipStart = useRef<number | null>(null)
  const steamStart = useRef<number | null>(null)
  const fill = useRef(1)

  useEffect(() => {
    if (sipId > 0 && !reduced) sipStart.current = performance.now()
    invalidate()
  }, [sipId, reduced, invalidate])

  useEffect(() => {
    if (refillId > 0 && !reduced) steamStart.current = performance.now()
    invalidate()
  }, [refillId, reduced, invalidate])

  useEffect(() => invalidate(), [level, invalidate])

  useFrame((state) => {
    const now = performance.now()

    // the mug lifts and tips toward its left, then settles back
    if (body.current) {
      let lift = 0
      if (sipStart.current !== null) {
        const p = Math.min(1, (now - sipStart.current) / SIP_MS)
        lift = Math.sin(p * Math.PI)
        if (p >= 1) sipStart.current = null
        else state.invalidate()
      }
      body.current.position.y = lift * 0.14
      body.current.rotation.z = lift * 0.42
    }

    // the coffee surface follows the level, and narrows with the mug's taper
    const goal = level / SIPS_PER_CUP
    fill.current = reduced ? goal : fill.current + (goal - fill.current) * 0.14
    if (Math.abs(goal - fill.current) < 0.002) fill.current = goal
    else state.invalidate()
    if (surface.current) {
      const y = SURFACE_LOW + (SURFACE_HIGH - SURFACE_LOW) * fill.current
      const taper = (0.92 + 0.08 * (y / H)) * R * 0.99
      surface.current.position.y = y
      surface.current.scale.setScalar(taper)
      surface.current.visible = fill.current > 0.01
    }

    if (steam.current) {
      const start = steamStart.current
      steam.current.visible = start !== null
      if (start !== null) {
        const p = (now - start) / STEAM_MS
        steam.current.children.forEach((puff, i) => {
          const local = Math.max(0, Math.min(1, (p - STEAM_PUFFS[i].delay) / (1 - STEAM_PUFFS[i].delay)))
          puff.position.y = H + local * 0.4
          puff.scale.setScalar(0.6 + local)
          const material = puffs.current[i]
          if (material) material.opacity = Math.sin(local * Math.PI) * 0.7
        })
        if (p >= 1) steamStart.current = null
        state.invalidate()
      }
    }
  })

  const ceramic = <meshStandardMaterial color={PAPER} roughness={0.45} />
  return (
    <Interactive enabled={enabled} onActivate={onClick} position={position}>
      {() => (
        <>
          <group ref={body}>
            <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[R, R * 0.92, H, 40, 1, true]} />
              <meshStandardMaterial color={PAPER} roughness={0.45} side={2} />
            </mesh>
            <mesh position={[0, 0.006, 0]} receiveShadow>
              <cylinderGeometry args={[R * 0.92, R * 0.92, 0.012, 40]} />
              {ceramic}
            </mesh>
            {/* coffee */}
            <mesh ref={surface} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1, 40]} />
              <meshStandardMaterial color="#4a2c1d" roughness={0.3} />
            </mesh>
            {/* accent band: outside only, so it doesn't show inside an empty mug */}
            <mesh position={[0, H * 0.55, 0]}>
              <cylinderGeometry args={[R * 0.975, R * 0.965, 0.05, 40, 1, true]} />
              <meshStandardMaterial color={ACCENT} roughness={0.6} />
            </mesh>
            {/* handle: a half ring on the +x side */}
            <mesh position={[R * 0.96, H * 0.5, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
              <torusGeometry args={[0.095, 0.022, 12, 24, Math.PI]} />
              {ceramic}
            </mesh>
          </group>
          <group ref={steam} visible={false}>
            {STEAM_PUFFS.map((puff, i) => (
              <mesh key={i} position={[puff.x, H, puff.z]} raycast={() => {}}>
                <sphereGeometry args={[0.035, 12, 10]} />
                <meshBasicMaterial
                  ref={(m) => {
                    puffs.current[i] = m
                  }}
                  color="#ffffff"
                  transparent
                  opacity={0}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        </>
      )}
    </Interactive>
  )
}
