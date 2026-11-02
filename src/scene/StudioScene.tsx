import { Component, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import type { Lang, View } from '../content'
import type { Coffee } from '../lib/useCoffee'
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
  coffee: Coffee
  onNavigate: (view: View) => void
  onSelectSkill: (id: string | null) => void
  onMugClick: () => void
}

/** Renders nothing if anything in the 3D tree throws; the HTML interface still has all navigation. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('3D scene disabled:', error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function StudioScene({ view, lang, activeSkillId, coffee, onNavigate, onSelectSkill, onMugClick }: Props) {
  const [supported] = useState(hasWebGL)
  if (!supported) return null

  return (
    <div className="scene" aria-hidden="true">
      <SceneBoundary>
        <Canvas
          frameloop="demand"
          dpr={[1, 3]}
          shadows
          gl={{ antialias: true, toneMapping: NoToneMapping }}
          camera={{ fov: FOV, near: 0.1, far: 60, position: [3, 3, 6] }}
        >
          <color attach="background" args={[PLASTER]} />
          {/* warm, low-contrast early-evening light */}
          <hemisphereLight args={['#fff0dc', '#d9bf9a', 1.8]} />
          <directionalLight
            position={[-3, 7, 5]}
            intensity={1.7}
            color="#ffd9a8"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={6}
            shadow-camera-bottom={-6}
            shadow-camera-near={0.5}
            shadow-camera-far={24}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
          />
          {/* gentle monitor glow */}
          <pointLight position={[0, DESK_TOP + 0.75, 0.2]} intensity={0.45} color="#fff1d6" distance={3.5} decay={2} />
          <CameraRig view={view} />
          <Room lampDimId={coffee.dimId} />
          <Mug position={[-0.9, DESK_TOP, -0.2]} enabled={view === 'desk'} coffee={coffee} onClick={onMugClick} />
          <Monitor view={view} lang={lang} onNavigate={onNavigate} />
          <Keyboard view={view} lang={lang} activeSkillId={activeSkillId} onNavigate={onNavigate} onSelectSkill={onSelectSkill} />
          <Notebook view={view} lang={lang} onNavigate={onNavigate} />
          <Phone view={view} lang={lang} onNavigate={onNavigate} />
        </Canvas>
      </SceneBoundary>
    </div>
  )
}
