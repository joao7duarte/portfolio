import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import type { Lang, View } from '../content'
import { hideBoot } from '../lib/boot'
import { CameraRig, FOV } from './CameraRig'
import { Monitor, Notebook, Phone } from './Gadgets'
import { Keyboard } from './Keyboard'
import { Mug } from './Mug'
import { DESK_TOP } from './dims'
import { PLASTER } from './palette'
import { Room } from './Room'

type Props = {
  view: View
  lang: Lang
  activeSkillId: string | null
  onNavigate: (view: View) => void
  onSelectSkill: (id: string | null) => void
}

/** Renders nothing if anything in the 3D tree throws; the HTML interface still has all navigation. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('3D scene disabled:', error)
    hideBoot()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Lifts the loading screen once the room's first frame is on screen. */
function FirstFrame() {
  const seen = useRef(false)
  useFrame(() => {
    if (seen.current) return
    seen.current = true
    // useFrame runs before the frame is drawn, so wait for the next one
    requestAnimationFrame(() => hideBoot())
  })
  return null
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function StudioScene({ view, lang, activeSkillId, onNavigate, onSelectSkill }: Props) {
  const [supported] = useState(hasWebGL)
  // without WebGL there is no room to wait for
  useEffect(() => {
    if (!supported) hideBoot()
  }, [supported])
  if (!supported) return null

  return (
    <div className="scene" aria-hidden="true">
      <SceneBoundary>
        <Canvas
          frameloop="demand"
          dpr={[1, 3]}
          gl={{ antialias: true, toneMapping: NoToneMapping }}
          camera={{ fov: FOV, near: 0.1, far: 90, position: [3, 3, 6] }}
        >
          <color attach="background" args={[PLASTER]} />
          {/* night: the room is lit only by the desk lamp (in Room) and the window; a faint fill keeps shapes readable */}
          <hemisphereLight args={['#c9d4ff', '#3a2e24', 0.22]} />
          {/* cool night light from the window; the room's shadows are baked, so no shadow map */}
          <directionalLight
            position={[-0.4, DESK_TOP + 3, -4]}
            intensity={0.7}
            color="#9fb4ff"
          />
          {/* glow just inside the window */}
          <pointLight position={[-0.15, DESK_TOP + 1.3, -1.0]} intensity={1.4} color="#8fa8ff" distance={4} decay={2} />
          <CameraRig view={view} />
          {/* the loading screen stays up until the baked room and the Blender models have loaded */}
          <Suspense fallback={null}>
            <Room />
            <Mug view={view} lang={lang} onNavigate={onNavigate} />
            <Monitor view={view} lang={lang} onNavigate={onNavigate} />
            <FirstFrame />
          </Suspense>
          <Keyboard view={view} lang={lang} activeSkillId={activeSkillId} onNavigate={onNavigate} onSelectSkill={onSelectSkill} />
          <Notebook view={view} lang={lang} onNavigate={onNavigate} />
          <Phone view={view} lang={lang} onNavigate={onNavigate} />
        </Canvas>
      </SceneBoundary>
    </div>
  )
}
