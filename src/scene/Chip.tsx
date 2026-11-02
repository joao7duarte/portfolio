import { useRef } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, type Group, type Mesh } from 'three'
import { useChipTexture } from './textures'

const tmp = new Vector3()
/** Chip width as a fraction of camera distance, so every chip has the same apparent size. */
const SIZE = 0.062
const MIN_ASPECT = 0.75

/** Small quiet label that tells visitors an object is clickable. Drawn with a canvas, no fonts fetched. */
export function Chip({
  text,
  position,
  hovered,
}: {
  text: string
  position: [number, number, number]
  hovered: boolean
}) {
  const map = useChipTexture(text)
  const group = useRef<Group>(null)
  const mesh = useRef<Mesh>(null)
  // On portrait phones chips would cover the objects, and the HTML nav already names each section.
  const portrait = useThree((s) => s.size.width / Math.max(1, s.size.height) < MIN_ASPECT)

  useFrame(({ camera }) => {
    if (!group.current || !mesh.current) return
    group.current.getWorldPosition(tmp)
    const s = tmp.distanceTo(camera.position) * SIZE * (hovered ? 1.1 : 1)
    mesh.current.scale.set(s, s, s)
  })

  if (portrait) return null

  return (
    <Billboard ref={group} position={position}>
      <mesh ref={mesh} renderOrder={10}>
        <planeGeometry args={[1, 0.3125]} />
        <meshBasicMaterial map={map} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  )
}
