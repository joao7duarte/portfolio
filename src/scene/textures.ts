import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { SKILL_ICONS } from './skillIcons'
import { ACCENT, FLOOR, FONT, GRAPHITE, PAPER, PLASTER } from './palette'

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

/** Picture of a few project windows, shown on the monitor. */
export function useScreenTexture() {
  return useMade(
    () =>
      make(1280, 720, (ctx, w) => {
        const bg = ctx.createLinearGradient(0, 0, w, 720)
        bg.addColorStop(0, PLASTER)
        bg.addColorStop(1, FLOOR)
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, 720)

        // menu bar
        ctx.fillStyle = PAPER
        ctx.fillRect(0, 0, w, 44)
        ctx.fillStyle = GRAPHITE
        ctx.fillRect(20, 16, 90, 12)
        ctx.fillRect(w - 160, 16, 130, 12)

        const win = (x: number, y: number, ww: number, hh: number, dark: boolean) => {
          ctx.save()
          ctx.shadowColor = 'rgba(35,41,46,0.28)'
          ctx.shadowBlur = 36
          ctx.shadowOffsetY = 14
          ctx.fillStyle = dark ? GRAPHITE : PAPER
          pill(ctx, x, y, ww, hh, 16)
          ctx.fill()
          ctx.restore()
          ;['#e8695f', '#e8b95f', '#6fcf8a'].forEach((c, i) => {
            ctx.fillStyle = c
            ctx.beginPath()
            ctx.arc(x + 28 + i * 24, y + 26, 7, 0, Math.PI * 2)
            ctx.fill()
          })
        }

        // window A: website
        win(90, 110, 640, 430, false)
        ctx.fillStyle = ACCENT
        pill(ctx, 120, 160, 580, 150, 10)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.fillRect(150, 200, 260, 22)
        ctx.fillRect(150, 240, 180, 14)
        ctx.fillStyle = '#e3d8c4'
        for (let i = 0; i < 3; i++) {
          pill(ctx, 120 + i * 198, 340, 184, 150, 10)
          ctx.fill()
        }

        // window B: code
        win(520, 250, 600, 400, true)
        const widths = [300, 380, 220, 340, 260, 400, 180, 320]
        widths.forEach((ww, i) => {
          ctx.fillStyle = i % 3 === 0 ? ACCENT : '#7a6a5c'
          ctx.fillRect(560 + (i % 2) * 36, 306 + i * 38, ww, 12)
        })

        // window C: small card
        win(860, 100, 300, 190, false)
        ctx.fillStyle = ACCENT
        ctx.beginPath()
        ctx.arc(930, 200, 42, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#e3d8c4'
        ctx.fillRect(995, 180, 130, 14)
        ctx.fillRect(995, 210, 90, 14)
      }),
    'screen',
  )
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
export function useRugTexture() {
  return useMade(
    () =>
      make(1024, 736, (ctx, w, h) => {
        ctx.beginPath()
        ctx.roundRect(0, 0, w, h, 26)
        ctx.clip()
        ctx.fillStyle = '#c99d72'
        ctx.fillRect(0, 0, w, h)
        ctx.strokeStyle = 'rgba(90,60,30,0.10)'
        ctx.lineWidth = 2
        for (let x = 0; x < w; x += 7) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, h)
          ctx.stroke()
        }
        ctx.strokeStyle = 'rgba(255,240,215,0.10)'
        for (let y = 0; y < h; y += 9) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
          ctx.stroke()
        }
        ctx.strokeStyle = ACCENT
        ctx.lineWidth = 34
        ctx.strokeRect(40, 40, w - 80, h - 80)
        ctx.strokeStyle = PAPER
        ctx.lineWidth = 10
        ctx.strokeRect(92, 92, w - 184, h - 184)
        ctx.strokeStyle = '#a7623f'
        ctx.lineWidth = 6
        ctx.strokeRect(116, 116, w - 232, h - 232)
        // row of diamonds along the middle
        ctx.fillStyle = 'rgba(251,246,236,0.55)'
        for (let i = 0; i < 7; i++) {
          const cx = 190 + i * ((w - 380) / 6)
          ctx.beginPath()
          ctx.moveTo(cx, h / 2 - 34)
          ctx.lineTo(cx + 26, h / 2)
          ctx.lineTo(cx, h / 2 + 34)
          ctx.lineTo(cx - 26, h / 2)
          ctx.closePath()
          ctx.fill()
        }
      }),
    'rug',
  )
}

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
