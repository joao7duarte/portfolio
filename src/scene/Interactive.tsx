import { useEffect, useState, type ReactNode } from 'react'
import { useCursor } from '@react-three/drei'


type Props = {
  enabled: boolean
  onActivate: () => void
  position?: [number, number, number]
  rotation?: [number, number, number]
  grow?: number
  lift?: number
  children: (hovered: boolean) => ReactNode
}

/**
 * 3D-only clickable object: pointer cursor, small hover lift, click.
 * Keyboard users use the HTML navigation, so this is intentionally pointer-only.
 */
export function Interactive({
  enabled,
  onActivate,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  grow = 1.02,
  lift = 0.012,
  children,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const active = hovered && enabled
  useCursor(active)
  useEffect(() => {
    if (!enabled) setHovered(false)
  }, [enabled])

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        if (!enabled) return
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        if (!enabled) return
        e.stopPropagation()
        onActivate()
      }}
    >
      <group position={[0, active ? lift : 0, 0]} scale={active ? grow : 1}>
        {children(active)}
      </group>
    </group>
  )
}
