import { useMemo, useState } from 'react'
import { RoundedBox, useCursor } from '@react-three/drei'
import { skills, strings, type Lang, type View } from '../content'
import { Chip } from './Chip'
import { DESK_TOP } from './dims'
import { Interactive } from './Interactive'
import { ACCENT, GRAPHITE, PAPER } from './palette'
import { useKeyIconTexture } from './textures'

export const KEYBOARD_POS: [number, number, number] = [0.08, DESK_TOP, 0.3]

const U = 0.105 // key pitch
const KEY_H = 0.028
const SKILL_H = 0.036
const BASE_Y = 0.03
const COLS = 15 // units per row

type Cell = { w: number; skillIndex?: number; x: number; z: number }
type Spec = { w: number; skill?: boolean }

/** Skill keys that fit in the second and third rows, between their wide edge keys. */
const ROW2_KEYS = 12
const ROW3_KEYS = 11

function buildLayout(): Cell[] {
  const one = (count: number): Spec[] => Array.from({ length: count }, () => ({ w: 1 }))
  // `count` skill keys centred among `capacity` unit keys
  const centred = (capacity: number, count: number): Spec[] => {
    const side = Math.max(0, capacity - count)
    const left = Math.floor(side / 2)
    return [
      ...one(left),
      ...Array.from({ length: count }, (): Spec => ({ w: 1, skill: true })),
      ...one(side - left),
    ]
  }
  // one row when they fit, otherwise split evenly so no key sits alone
  const n = skills.length
  const row2 = n <= ROW2_KEYS ? n : Math.min(Math.ceil(n / 2), ROW2_KEYS)
  const row3 = Math.min(n - row2, ROW3_KEYS)
  const rows: Spec[][] = [
    [...one(13), { w: 2 }],
    [{ w: 1.5 }, ...centred(ROW2_KEYS, row2), { w: 1.5 }],
    [{ w: 1.75 }, ...centred(ROW3_KEYS, row3), { w: 2.25 }],
    [{ w: 1.25 }, { w: 1.25 }, { w: 1.25 }, { w: 6.25 }, { w: 1.25 }, { w: 1.25 }, { w: 1.25 }, { w: 1.25 }],
  ]
  const cells: Cell[] = []
  let s = 0
  rows.forEach((row, r) => {
    let cursor = -(COLS * U) / 2
    row.forEach((c) => {
      cells.push({
        w: c.w,
        skillIndex: c.skill ? s++ : undefined,
        x: cursor + (c.w * U) / 2,
        z: (r - 1.5) * U,
      })
      cursor += c.w * U
    })
  })
  return cells
}

type KeyProps = {
  cell: Cell
  pressed: boolean
  kbHover: boolean
  selectable: boolean
  onSelect: (id: string) => void
}

function Key({ cell, pressed, kbHover, selectable, onSelect }: KeyProps) {
  const skill = cell.skillIndex !== undefined ? skills[cell.skillIndex] : undefined
  const [hov, setHov] = useState(false)
  const icon = useKeyIconTexture(skill?.id ?? '', pressed)
  const hot = !!skill && selectable && hov
  useCursor(hot)

  const h = skill ? SKILL_H : KEY_H
  const y = BASE_Y + h / 2 - (pressed ? 0.015 : 0)
  // skill keys are light paper caps carrying a brand logo; filler keys are a touch darker
  const color = !skill ? '#e9e0cd' : pressed ? '#dcefe6' : PAPER
  const glow = pressed ? 0.3 : hot ? 0.14 : skill && kbHover ? 0.08 : 0

  return (
    <group
      position={[cell.x, y, cell.z]}
      onPointerOver={(e) => {
        if (!skill || !selectable) return
        e.stopPropagation()
        setHov(true)
      }}
      onPointerOut={() => setHov(false)}
      onClick={(e) => {
        if (!skill || !selectable) return
        e.stopPropagation()
        onSelect(skill.id)
      }}
    >
      <RoundedBox args={[cell.w * U - 0.012, h, U - 0.012]} radius={0.008} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={color} emissive={ACCENT} emissiveIntensity={glow} roughness={0.55} />
      </RoundedBox>
      {skill && (
        <mesh position={[0, h / 2 + 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[U - 0.012, U - 0.012]} />
          <meshBasicMaterial map={icon} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

type Props = {
  view: View
  lang: Lang
  activeSkillId: string | null
  onNavigate: (view: View) => void
  onSelectSkill: (id: string | null) => void
}

export function Keyboard({ view, lang, activeSkillId, onNavigate, onSelectSkill }: Props) {
  const cells = useMemo(buildLayout, [])
  const desk = view === 'desk'
  return (
    <Interactive enabled={desk} onActivate={() => onNavigate('skills')} position={KEYBOARD_POS} grow={1.015}>
      {(hovered) => (
        <>
          <RoundedBox
            args={[COLS * U + 0.1, 0.03, 4 * U + 0.1]}
            radius={0.012}
            smoothness={3}
            position={[0, 0.015, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={GRAPHITE} roughness={0.6} />
          </RoundedBox>
          {cells.map((cell, i) => (
            <Key
              key={i}
              cell={cell}
              pressed={cell.skillIndex !== undefined && skills[cell.skillIndex]?.id === activeSkillId}
              kbHover={hovered}
              selectable={view === 'skills'}
              onSelect={onSelectSkill}
            />
          ))}
          {desk && <Chip text={strings[lang].skills} position={[0, 0.07, 0.4]} hovered={hovered} />}
          {desk && (
            // generous invisible hit box so the whole keyboard reads as one target
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[COLS * U + 0.1, 0.08, 4 * U + 0.1]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </>
      )}
    </Interactive>
  )
}
