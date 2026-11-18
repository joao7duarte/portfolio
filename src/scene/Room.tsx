import { useEffect, useRef } from 'react'
import type { Object3D, SpotLight } from 'three'
import { BakedRoom } from './BakedRoom'
import { DESK_TOP } from './dims'
import { SKY, useSkyTexture } from './textures'

const LAMP_POS: [number, number, number] = [1.4, DESK_TOP, -0.55]
const LAMP_INTENSITY = 5.5
/** Warm glow around the bulb that lights the room beyond the spot's pool. */
const BULB_INTENSITY = 2.6

/**
 * Cozy evening room. The room itself is baked in Blender (see BakedRoom); the lights here only light the
 * live menu objects on the desk, matching the baked lamp and window.
 */
export function Room() {
  return (
    <group>
      <BakedRoom />
      <LampLight />
      <NightSky />
    </group>
  )
}

function LampLight() {
  const spot = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)
  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])
  return (
    <group>
      <pointLight position={[LAMP_POS[0] + 0.15, DESK_TOP + 0.6, LAMP_POS[2] + 0.1]} color="#ffb35e" intensity={BULB_INTENSITY} distance={6} decay={1.6} />
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

/** The sky behind the baked city; unlit so the moon and stars glow. */
function NightSky() {
  const map = useSkyTexture()
  return (
    <mesh position={[SKY.x, SKY.y, SKY.z]} raycast={() => {}}>
      <planeGeometry args={[SKY.w, SKY.h]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  )
}
