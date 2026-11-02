import { RoundedBox } from '@react-three/drei'
import { strings, type Lang, type View } from '../content'
import { Chip } from './Chip'
import { DESK_TOP } from './dims'
import { Interactive } from './Interactive'
import { ACCENT, GRAPHITE } from './palette'
import { usePhoneTexture, useScreenTexture } from './textures'

export const MONITOR_POS: [number, number, number] = [0, DESK_TOP, -0.4]
export const NOTEBOOK_POS: [number, number, number] = [-1.35, DESK_TOP, 0.3]
export const PHONE_POS: [number, number, number] = [1.38, DESK_TOP, 0.3]
export const NOTEBOOK_ROT = 0.2
export const PHONE_ROT = -0.45

type Props = { view: View; lang: Lang; onNavigate: (view: View) => void }

function HitBox({ size, y }: { size: [number, number, number]; y: number }) {
  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

const cover = <meshStandardMaterial color="#fbf6ec" roughness={0.85} />
const graphite = <meshStandardMaterial color={GRAPHITE} roughness={0.45} metalness={0.25} />

export function Monitor({ view, lang, onNavigate }: Props) {
  const screen = useScreenTexture()
  const desk = view === 'desk'
  return (
    <Interactive enabled={desk} onActivate={() => onNavigate('projects')} position={MONITOR_POS} grow={1.015} lift={0.01}>
      {(hovered) => (
        <>
          <RoundedBox args={[0.5, 0.02, 0.26]} radius={0.008} smoothness={2} position={[0, 0.01, 0.02]} castShadow receiveShadow>
            {graphite}
          </RoundedBox>
          <mesh position={[0, 0.23, -0.04]} castShadow>
            <boxGeometry args={[0.07, 0.43, 0.04]} />
            {graphite}
          </mesh>
          <RoundedBox args={[1.6, 0.95, 0.05]} radius={0.02} smoothness={3} position={[0, 0.72, 0]} castShadow receiveShadow>
            {graphite}
          </RoundedBox>
          <mesh position={[0, 0.72, 0.0256]}>
            <planeGeometry args={[1.5, 0.844]} />
            <meshBasicMaterial map={screen} toneMapped={false} color={hovered ? '#ffffff' : '#f2f2f2'} />
          </mesh>
          {desk && <Chip text={strings[lang].projects} position={[0, 1.32, 0.05]} hovered={hovered} />}
          {desk && <HitBox size={[1.6, 1.0, 0.1]} y={0.72} />}
        </>
      )}
    </Interactive>
  )
}

export function Notebook({ view, lang, onNavigate }: Props) {
  const desk = view === 'desk'
  return (
    <Interactive enabled={desk} onActivate={() => onNavigate('experience')} position={NOTEBOOK_POS} rotation={[0, NOTEBOOK_ROT, 0]} grow={1.04}>
      {(hovered) => (
        <>
          <RoundedBox args={[0.5, 0.012, 0.66]} radius={0.005} smoothness={2} position={[0, 0.006, 0]} castShadow receiveShadow>
            {cover}
          </RoundedBox>
          <mesh position={[0, 0.02, 0.005]} castShadow receiveShadow>
            <boxGeometry args={[0.47, 0.016, 0.63]} />
            <meshStandardMaterial color="#eee3cf" roughness={0.95} />
          </mesh>
          <RoundedBox args={[0.5, 0.014, 0.66]} radius={0.005} smoothness={2} position={[0, 0.035, 0]} castShadow receiveShadow>
            {cover}
          </RoundedBox>
          {/* accent band */}
          <mesh position={[0.14, 0.0425, 0]}>
            <boxGeometry args={[0.045, 0.003, 0.664]} />
            <meshStandardMaterial color={ACCENT} roughness={0.6} />
          </mesh>
          {desk && <Chip text={strings[lang].experience} position={[0, 0.2, 0.05]} hovered={hovered} />}
          {desk && <HitBox size={[0.52, 0.06, 0.68]} y={0.03} />}
        </>
      )}
    </Interactive>
  )
}

export function Phone({ view, lang, onNavigate }: Props) {
  const face = usePhoneTexture()
  const desk = view === 'desk'
  return (
    <Interactive enabled={desk} onActivate={() => onNavigate('contact')} position={PHONE_POS} rotation={[0, PHONE_ROT, 0]} grow={1.05}>
      {(hovered) => (
        <>
          <RoundedBox args={[0.2, 0.012, 0.4]} radius={0.005} smoothness={3} position={[0, 0.006, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#5a4a40" roughness={0.45} metalness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0.0126, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.18, 0.38]} />
            <meshBasicMaterial map={face} toneMapped={false} color={hovered ? '#ffffff' : '#f4f4f4'} />
          </mesh>
          {desk && <Chip text={strings[lang].contact} position={[0, 0.2, 0.05]} hovered={hovered} />}
          {desk && <HitBox size={[0.36, 0.06, 0.56]} y={0.03} />}
        </>
      )}
    </Interactive>
  )
}
