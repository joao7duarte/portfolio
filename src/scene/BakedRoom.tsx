import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { Color, Mesh, MeshBasicMaterial, SRGBColorSpace, type Texture } from 'three'

/**
 * The room modelled and lit in Blender (blender/room.py). Light and colour are baked into three textures,
 * so it draws with unlit materials: soft shadows and bounce light cost nothing at runtime.
 */
const MODEL_URL = '/models/room.glb'
const MAPS = {
  Shell: '/models/room-shell.webp',
  Rug: '/models/room-rug.webp',
  Props: '/models/room-props.webp',
  Outside: '/models/room-outside.webp',
} as const
/** Parts that glow and carry no lightmap. */
const GLOWS: Record<string, string> = { Glow: '#4caf50', Bulb: '#ffe2b0', CityWarm: '#ffcf8a', CityCool: '#bcd4ff' }

export function BakedRoom() {
  const gltf = useGLTF(MODEL_URL)
  const maps = useTexture(MAPS as Record<keyof typeof MAPS, string>) as Record<keyof typeof MAPS, Texture>

  const scene = useMemo(() => {
    const root = gltf.scene.clone(true)
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return
      // nothing in the room is clickable, so it never blocks the menu objects
      o.raycast = () => {}
      const map = maps[o.name as keyof typeof MAPS]
      if (map) {
        // glTF UVs run top-down
        map.flipY = false
        map.colorSpace = SRGBColorSpace
        map.anisotropy = 4
        map.needsUpdate = true
        o.material = new MeshBasicMaterial({ map })
      } else if (o.name === 'Glass') {
        // the PC's tempered glass side: a faint smoked tint over the baked parts inside
        o.material = new MeshBasicMaterial({ color: '#0c100e', transparent: true, opacity: 0.18, depthWrite: false })
      } else if (o.name === 'WindowGlass') {
        // barely there: a cool sheen so the panes read as glass
        o.material = new MeshBasicMaterial({ color: '#9fb4ff', transparent: true, opacity: 0.07, depthWrite: false })
      } else if (GLOWS[o.name]) {
        o.material = new MeshBasicMaterial({ color: new Color(GLOWS[o.name]), toneMapped: false })
      }
    })
    return root
  }, [gltf, maps])

  return <primitive object={scene} />
}

useGLTF.preload(MODEL_URL)
