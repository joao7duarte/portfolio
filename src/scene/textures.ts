import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { SKILL_ICONS } from './skillIcons'
import { ACCENT, FONT, PAPER } from './palette'

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

function make(w: number, h: number, draw: Draw): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx, w, h)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Build a canvas texture once per key and dispose it on unmount. */
function useMade(factory: () => CanvasTexture, key: string): CanvasTexture {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tex = useMemo(factory, [key])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawDatabase(ctx: CanvasRenderingContext2D, color: string) {
  // generic database cylinder on a 24x24 grid
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.ellipse(12, 5.8, 7.2, 2.9, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(4.8, 5.8)
  ctx.lineTo(4.8, 18.2)
  ctx.ellipse(12, 18.2, 7.2, 2.9, 0, Math.PI, 0, true)
  ctx.lineTo(19.2, 5.8)
  ctx.stroke()
  for (const y of [10, 14.1]) {
    ctx.beginPath()
    ctx.ellipse(12, y, 7.2, 2.9, 0, 0, Math.PI)
    ctx.stroke()
  }
}

/** Brand logo for a skill key, with an accent ring when the key is selected. Transparent background. */
export function useKeyIconTexture(skillId: string, selected: boolean) {
  return useMade(
    () =>
      make(256, 256, (ctx, w, h) => {
        const icon = SKILL_ICONS[skillId]
        if (icon) {
          const size = w * 0.66
          ctx.save()
          ctx.translate((w - size) / 2, (h - size) / 2)
          ctx.scale(size / 24, size / 24)
          if (icon.kind === 'path') {
            ctx.fillStyle = icon.color
            ctx.fill(new Path2D(icon.path))
          } else if (icon.kind === 'oracle') {
            ctx.strokeStyle = icon.color
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.roundRect(1.5, 6.5, 21, 11, 5.5)
            ctx.stroke()
          } else {
            drawDatabase(ctx, icon.color)
          }
          ctx.restore()
        }
        if (selected) {
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 16
          ctx.beginPath()
          ctx.roundRect(8, 8, w - 16, h - 16, 26)
          ctx.stroke()
        }
      }),
    `${skillId}:${selected}`,
  )
}

export function useChipTexture(text: string) {
  return useMade(
    () =>
      make(512, 160, (ctx, w, h) => {
        ctx.fillStyle = PAPER
        pill(ctx, 6, 6, w - 12, h - 12, (h - 12) / 2)
        ctx.fill()
        ctx.strokeStyle = ACCENT
        ctx.lineWidth = 7
        ctx.stroke()
        ctx.fillStyle = ACCENT
        // longer Portuguese labels shrink to stay inside the pill
        ctx.font = `600 78px ${FONT}`
        const room = w - 90
        const measured = ctx.measureText(text).width
        if (measured > room) ctx.font = `600 ${Math.floor((78 * room) / measured)}px ${FONT}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, w / 2, h / 2 + 5)
      }),
    text,
  )
}

/** Real lines from src/scene/Mug.tsx (16-34), the code that makes the mug's steam rise, shown on the monitor. */
const SCREEN_CODE = {
  file: 'Mug.tsx',
  firstLine: 16,
  lines: [
    'export function Mug({ position, steaming }: { position: [number, number, number]; steaming: boolean }) {',
    '  const invalidate = useThree((s) => s.invalidate)',
    '  const reduced = useReducedMotion()',
    '  // steam rises on the desk view, unless the visitor turned animations off',
    '  const active = steaming && !reduced',
    '',
    '  const wisps = useRef<Group>(null)',
    '  const wispMats = useRef<(MeshBasicMaterial | null)[]>([])',
    '',
    '  useEffect(() => {',
    '    if (!active) {',
    '      invalidate()',
    '      return',
    '    }',
    '    const t = window.setInterval(() => {',
    '      if (!document.hidden) invalidate()',
    '    }, 1000 / WISP_FPS)',
    '    return () => window.clearInterval(t)',
    '  }, [active, invalidate])',
  ],
}

/** Soft, illustrated syntax colours: each token is drawn as a pill, to match the room's drawn style. */
const SYNTAX = {
  keyword: '#e48a6a',
  storage: '#7fb3d5',
  fn: '#e8c872',
  type: '#6cc4a4',
  variable: '#d9d2c5',
  constant: '#a7d6f0',
  number: '#b9d98a',
  string: '#e8a87c',
  comment: '#4caf50',
  plain: '#6b625c',
}
const KEYWORDS = new Set(['export', 'return', 'if', 'import', 'from'])
const STORAGE = new Set(['function', 'const', 'let', 'null', 'true', 'false', 'number', 'boolean'])

/** Splits one line of TypeScript into coloured tokens. Small, but enough for the snippet above. */
function highlight(line: string): { text: string; color: string; start: number }[] {
  const out: { text: string; color: string; start: number }[] = []
  const comment = line.indexOf('//')
  const code = comment >= 0 ? line.slice(0, comment) : line
  const re = /([A-Za-z_$][\w$]*)|(\d+(?:\.\d+)?)|('[^']*'|"[^"]*")|(\s+)|(.)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code))) {
    const [tok, word, num, str, space] = m
    if (space) continue
    let color = SYNTAX.plain
    if (word) {
      const next = code.slice(re.lastIndex).trimStart()[0]
      if (KEYWORDS.has(word)) color = SYNTAX.keyword
      else if (STORAGE.has(word)) color = SYNTAX.storage
      else if (next === '(' || (next === '<' && /^use/.test(word))) color = SYNTAX.fn
      else if (/^[A-Z][A-Z0-9_]+$/.test(word)) color = SYNTAX.constant
      else if (/^[A-Z]/.test(word)) color = SYNTAX.type
      else color = SYNTAX.variable
    } else if (num) color = SYNTAX.number
    else if (str) color = SYNTAX.string
    out.push({ text: tok, color, start: m.index })
  }
  if (comment >= 0) out.push({ text: line.slice(comment), color: SYNTAX.comment, start: comment })
  return out
}

/** The editor, drawn: rounded window, tabs, and the snippet as pills that keep each token's length and colour. */
function drawEditor(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1f1b1a'
  ctx.fillRect(0, 0, w, h)

  // tab bar with two tabs
  ctx.fillStyle = '#2b2522'
  ctx.fillRect(0, 0, w, 56)
  ctx.fillStyle = '#1f1b1a'
  pill(ctx, 24, 12, 200, 44, 12)
  ctx.fill()
  ctx.fillStyle = '#4caf50'
  pill(ctx, 44, 26, 26, 14, 7)
  ctx.fill()
  ctx.fillStyle = '#d9d2c5'
  pill(ctx, 80, 26, 120, 14, 7)
  ctx.fill()
  ctx.fillStyle = '#4a413c'
  pill(ctx, 244, 26, 150, 14, 7)
  ctx.fill()

  // code: one pill per token, columns kept from the real source
  const char = 11.2
  const lineH = 30
  const top = 88
  const gutter = 96
  const bar = 14
  SCREEN_CODE.lines.forEach((line, i) => {
    const y = top + i * lineH
    // line number
    const digits = String(SCREEN_CODE.firstLine + i).length
    ctx.fillStyle = i === 3 ? '#8c837c' : '#4a413c'
    pill(ctx, gutter - 30 - digits * char, y, digits * char, bar, bar / 2)
    ctx.fill()
    for (const t of highlight(line)) {
      const x = gutter + t.start * char
      if (x > w - 20) continue
      const width = Math.min(t.text.length * char - 3, w - 20 - x)
      ctx.fillStyle = t.color
      // punctuation is quieter and thinner than words
      const thin = t.color === SYNTAX.plain
      pill(ctx, x, y + (thin ? 3 : 0), Math.max(width, 6), thin ? bar - 6 : bar, (thin ? bar - 6 : bar) / 2)
      ctx.fill()
    }
  })
  // the cursor, at the end of the comment line
  ctx.fillStyle = '#f2f2f2'
  ctx.fillRect(gutter + SCREEN_CODE.lines[3].length * char + 4, top + 3 * lineH - 6, 3, 26)
}

/** A drawn code editor on the monitor. */
export function useScreenTexture() {
  return useMade(() => make(1280, 720, drawEditor), 'screen')
}

export function usePhoneTexture() {
  return useMade(
    () =>
      make(256, 512, (ctx, w, h) => {
        ctx.fillStyle = PAPER
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = ACCENT
        ctx.beginPath()
        ctx.arc(w / 2, h / 2 - 20, 70, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 8
        ctx.lineJoin = 'round'
        ctx.strokeRect(w / 2 - 32, h / 2 - 44, 64, 46)
        ctx.beginPath()
        ctx.moveTo(w / 2 - 32, h / 2 - 44)
        ctx.lineTo(w / 2, h / 2 - 16)
        ctx.lineTo(w / 2 + 32, h / 2 - 44)
        ctx.stroke()
        ctx.fillStyle = '#e3d8c4'
        ctx.fillRect(w / 2 - 60, h / 2 + 90, 120, 12)
        ctx.fillRect(w / 2 - 40, h / 2 + 120, 80, 12)
      }),
    'phone',
  )
}

/** Woven rug: warm base, fine thread lines and two borders. Transparent rounded corners. */
/** Night city seen through a window, out of focus: a dusk gradient and soft round light blurs (bokeh). */
export function useWindowTexture() {
  return useMade(
    () =>
      make(1024, 680, (ctx, w, h) => {
        const sky = ctx.createLinearGradient(0, 0, 0, h)
        sky.addColorStop(0, '#0d1424')
        sky.addColorStop(0.6, '#1d2438')
        sky.addColorStop(1, '#3b2c34')
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, w, h)
        // dark, blurred building shapes
        const rand = seeded(7)
        ctx.fillStyle = 'rgba(8,10,18,0.55)'
        for (let x = 0; x < w; ) {
          const bw = 60 + rand() * 120
          const bh = h * (0.25 + rand() * 0.45)
          ctx.fillRect(x, h - bh, bw - 6, bh)
          x += bw
        }
        // bokeh: warm street and window lights, a few cool ones and one in the brand green
        const colors = ['255,196,120', '255,170,90', '255,226,170', '170,200,255', '255,140,110', '76,175,80']
        for (let i = 0; i < 70; i++) {
          const x = rand() * w
          const y = h * (0.25 + rand() * 0.75)
          const r = 14 + rand() * 46
          const c = colors[i % 9 === 0 ? 5 : Math.floor(rand() * 5)]
          const a = 0.18 + rand() * 0.4
          const g = ctx.createRadialGradient(x, y, 0, x, y, r)
          g.addColorStop(0, `rgba(${c},${a})`)
          g.addColorStop(0.7, `rgba(${c},${a * 0.8})`)
          g.addColorStop(1, `rgba(${c},0)`)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }),
    'window',
  )
}

/** Repeatable pseudo-random numbers, so the view looks the same on every visit. */
function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t * 16807) % 2147483647
    return (t - 1) / 2147483646
  }
}
