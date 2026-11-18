import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Mesh, type Group, type MeshBasicMaterial } from 'three'
import { strings, type Lang, type View } from '../content'
import { useReducedMotion } from './CameraRig'
import { Chip } from './Chip'
import { MUG_POS } from './dims'
import { Interactive } from './Interactive'

/** Modelled in Blender (blender/mug.py): 0.32 wide, 0.35 tall, origin at the base, handle on +x. */
const MODEL_URL = '/models/mug.glb'
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

  const gltf = useGLTF(MODEL_URL)
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true)
    scene.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = o.name !== 'Coffee'
        o.receiveShadow = true
      }
    })
    return scene
  }, [gltf])

  return (
    <Interactive enabled={desk} onActivate={() => onNavigate('about')} position={MUG_POS} grow={1.04}>
      {(hovered) => (
        <>
          <primitive object={model} />
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

useGLTF.preload(MODEL_URL)
