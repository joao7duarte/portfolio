import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { View } from '../content'
import { DESK_TOP } from './dims'
import { KEYBOARD_POS } from './Keyboard'
import { MONITOR_POS, NOTEBOOK_POS, NOTEBOOK_ROT, PHONE_POS, PHONE_ROT } from './Gadgets'

export const FOV = 32
const TAN = Math.tan((FOV / 2) * (Math.PI / 180))

/** Wide screens: HTML panel on the right. Narrow screens: panel over the bottom. */
const WIDE_ASPECT = 1.15
/** Share of the viewport left free by the HTML panel. */
const FREE_WIDE = 0.55
const FREE_NARROW = 0.52

/** Transition length between views, independent of frame rate. */
const DURATION_MS = 1000

type Spec = {
  center: Vector3
  half: Vector3 // half-size of the object's world bounds
  dir: Vector3 // direction from the object towards the camera
  pad: number // breathing room around the bounds
  padNarrow?: number // pad on narrow screens, when it differs
  minSize?: number // smallest framed extent, so tiny objects are not blown up
  panel: boolean // HTML panel covers part of the screen in this view
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
const at = (p: [number, number, number], dy = 0) => v(p[0], p[1] + dy, p[2])
/** Half extents of a box (hx, hz) rotated by `a` around Y. */
const rot = (hx: number, hy: number, hz: number, a: number) =>
  v(Math.abs(Math.cos(a)) * hx + Math.abs(Math.sin(a)) * hz, hy, Math.abs(Math.sin(a)) * hx + Math.abs(Math.cos(a)) * hz)

/** Floor to the top of the monitor, the tallest thing on the desk. */
const DESK_FULL_H = DESK_TOP + 1.2

const SPECS: Record<View, Spec> = {
  desk: { center: v(0, DESK_FULL_H / 2, 0), half: v(1.7, DESK_FULL_H / 2, 0.7), dir: v(0.5, 0.5, 1), pad: 1.22, padNarrow: 0.98, panel: false },
  projects: { center: v(MONITOR_POS[0], MONITOR_POS[1] + 0.72, MONITOR_POS[2] + 0.03), half: v(0.8, 0.475, 0.03), dir: v(0.08, 0.03, 1), pad: 1.06, panel: false },
  skills: { center: at(KEYBOARD_POS, 0.03), half: v(0.9, 0.03, 0.3), dir: v(0, 1, 0.3), pad: 1.3, panel: true },
  experience: { center: at(NOTEBOOK_POS, 0.03), half: rot(0.25, 0.03, 0.33, NOTEBOOK_ROT), dir: v(0, 1, 0.3), pad: 1.5, minSize: 1.0, panel: true },
  contact: { center: at(PHONE_POS, 0.02), half: rot(0.1, 0.03, 0.2, PHONE_ROT), dir: v(0, 1, 0.3), pad: 1.5, minSize: 1.0, panel: true },
}

export type Goal = { pos: Vector3; target: Vector3 }

export function computeGoal(view: View, aspect: number): Goal {
  const s = SPECS[view]
  const wide = aspect >= WIDE_ASPECT
  const fracX = s.panel && wide ? FREE_WIDE : 1
  const fracY = !wide && (s.panel || view === 'projects') ? FREE_NARROW : 1
  // where the framed object should sit, as a fraction of the viewport (+x right, +y up)
  let fx = -(1 - fracX) / 2
  let fy = (1 - fracY) / 2
  if (view === 'desk') {
    // desk a touch low/right, leaving the wall top-left calm
    fx = wide ? 0.03 : 0
    fy = wide ? -0.04 : -0.06
  }

  const dir = s.dir.clone().normalize()
  const forward = dir.clone().negate()
  const right = new Vector3().crossVectors(forward, v(0, 1, 0)).normalize()
  const up = new Vector3().crossVectors(right, forward).normalize()

  // projected size of the bounds on the screen axes
  const extent = (a: Vector3) => 2 * (s.half.x * Math.abs(a.x) + s.half.y * Math.abs(a.y) + s.half.z * Math.abs(a.z))
  const pad = wide ? s.pad : (s.padNarrow ?? s.pad)
  const w = Math.max(extent(right), s.minSize ?? 0) * pad
  const h = Math.max(extent(up), s.minSize ?? 0) * pad
  const d = Math.max(w / fracX / (2 * TAN * aspect), h / fracY / (2 * TAN))

  const fullH = 2 * d * TAN
  const fullW = fullH * aspect
  const target = s.center.clone().addScaledVector(right, -fx * fullW).addScaledVector(up, -fy * fullH)
  return { target, pos: target.clone().addScaledVector(dir, d) }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/**
 * Frames each view and animates between views over a fixed time. The camera is otherwise still.
 * The scene renders on demand, so we invalidate only while a transition runs.
 */
export function CameraRig({ view }: { view: View }) {
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height))
  const invalidate = useThree((s) => s.invalidate)
  const reduced = useReducedMotion()

  const goal = useMemo(() => computeGoal(view, aspect), [view, aspect])
  const curPos = useRef(new Vector3())
  const curLook = useRef(new Vector3())
  const startPos = useRef(new Vector3())
  const startLook = useRef(new Vector3())
  const t0 = useRef(0)
  const animating = useRef(false)
  const started = useRef(false)
  const lastView = useRef<View | null>(null)

  // New view: transition from wherever the camera is. First mount, reduced motion and resizes snap.
  useLayoutEffect(() => {
    const viewChanged = lastView.current !== view
    lastView.current = view
    if (!started.current || reduced || !viewChanged) {
      started.current = true
      animating.current = false
    } else {
      startPos.current.copy(curPos.current)
      startLook.current.copy(curLook.current)
      t0.current = performance.now()
      animating.current = true
    }
    invalidate()
  }, [goal, view, reduced, invalidate])

  useFrame((state) => {
    if (animating.current) {
      const p = Math.min(1, (performance.now() - t0.current) / DURATION_MS)
      const e = ease(p)
      curPos.current.lerpVectors(startPos.current, goal.pos, e)
      curLook.current.lerpVectors(startLook.current, goal.target, e)
      if (p >= 1) animating.current = false
      else state.invalidate()
    } else {
      curPos.current.copy(goal.pos)
      curLook.current.copy(goal.target)
    }
    camera.position.copy(curPos.current)
    camera.lookAt(curLook.current)
  })

  return null
}
