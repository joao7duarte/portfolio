import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, MeshBasicMaterial } from 'three'
import { strings, type Lang, type View } from '../content'
import { useReducedMotion } from './CameraRig'
import { Chip } from './Chip'
import { MUG_POS } from './dims'
import { Interactive } from './Interactive'
import { ACCENT, PAPER } from './palette'

const R = 0.16
const H = 0.35
/** Wisps of steam that rise all the time, each a share of the loop apart. */
const WISPS = [0, 0.25, 0.5, 0.75]
const WISP_MS = 3400
/** The room only redraws on demand, so the wisps ask for a frame at this rate while they show. */
const WISP_FPS = 30

type Props = {
  view: View
  lang: Lang
  onNavigate: (view: View) => void
}

/** Sized against the keyboard (44cm, 1.575 wide): a 9cm x 10cm mug is about 0.32 wide and 0.35 tall. Opens the About section. */
export function Mug({ view, lang, onNavigate }: Props) {
  const desk = view === 'desk'
  const invalidate = useThree((s) => s.invalidate)
  const reduced = useReducedMotion()
  // steam rises on the desk view, unless the visitor turned animations off
  const active = desk && !reduced

  const wisps = useRef<Group>(null)
  const wispMats = useRef<(MeshBasicMaterial | null)[]>([])

  useEffect(() => {
    if (!active) {
      invalidate()
      return
    }
    const t = window.setInterval(() => {
      if (!document.hidden) invalidate()
    }, 1000 / WISP_FPS)
    return () => window.clearInterval(t)
  }, [active, invalidate])

  useFrame(() => {
    if (!wisps.current) return
    wisps.current.visible = active
    if (!active) return
    const now = performance.now()
    wisps.current.children.forEach((wisp, i) => {
      const p = (now / WISP_MS + WISPS[i]) % 1
      wisp.position.set(Math.sin(p * Math.PI * 2 + i) * 0.035, H + 0.02 + p * 0.5, Math.cos(p * Math.PI * 1.5 + i) * 0.03)
      // soft and stretched upward, widening as it rises
      const w = 0.6 + p * 1.5
      wisp.scale.set(w, w * 1.6, w)
      const material = wispMats.current[i]
      if (material) material.opacity = Math.sin(p * Math.PI) * 0.14
    })
  })

  const ceramic = <meshStandardMaterial color={PAPER} roughness={0.45} />
  return (
    <Interactive enabled={desk} onActivate={() => onNavigate('about')} position={MUG_POS} grow={1.04}>
      {(hovered) => (
        <>
          <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[R, R * 0.92, H, 40, 1, true]} />
            <meshStandardMaterial color={PAPER} roughness={0.45} side={2} />
          </mesh>
          <mesh position={[0, 0.006, 0]} receiveShadow>
            <cylinderGeometry args={[R * 0.92, R * 0.92, 0.012, 40]} />
            {ceramic}
          </mesh>
          {/* coffee */}
          <mesh position={[0, H - 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[R * 0.97, 40]} />
            <meshStandardMaterial color="#4a2c1d" roughness={0.3} />
          </mesh>
          {/* accent band: outside only */}
          <mesh position={[0, H * 0.55, 0]}>
            <cylinderGeometry args={[R * 0.975, R * 0.965, 0.05, 40, 1, true]} />
            <meshStandardMaterial color={ACCENT} roughness={0.6} />
          </mesh>
          {/* handle: a half ring on the +x side */}
          <mesh position={[R * 0.96, H * 0.5, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <torusGeometry args={[0.095, 0.022, 12, 24, Math.PI]} />
            {ceramic}
          </mesh>
          <group ref={wisps} visible={false}>
            {WISPS.map((_, i) => (
              <mesh key={i} raycast={() => {}}>
                <sphereGeometry args={[0.04, 12, 10]} />
                <meshBasicMaterial
                  ref={(m) => {
                    wispMats.current[i] = m
                  }}
                  color="#ffffff"
                  transparent
                  opacity={0}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
          {desk && <Chip text={strings[lang].aboutMe} position={[0, H + 0.2, 0.05]} hovered={hovered} />}
          {desk && (
            // invisible hit box around the mug and handle, so it is easy to click
            <mesh position={[0.04, H / 2, 0]}>
              <boxGeometry args={[0.44, H + 0.04, 0.36]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </>
      )}
    </Interactive>
  )
}
