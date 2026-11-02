import { useCallback, useEffect, useState } from 'react'

export const SIPS_PER_CUP = 3
const REWARD_REFILL = 3
const NOTE_MS = 4500

export type CoffeeNote = 'coffeeFact' | 'coffeeSip' | 'coffeeEmpty' | 'coffeeRefill' | 'coffeeReward'

export type Coffee = {
  /** Sips left in the mug, from SIPS_PER_CUP down to 0. */
  level: number
  refills: number
  note: CoffeeNote | null
  /** Each counter goes up once per event, so the scene can start that event's animation. */
  noteId: number
  sipId: number
  refillId: number
  dimId: number
}

const initial: Coffee = { level: SIPS_PER_CUP, refills: 0, note: null, noteId: 0, sipId: 0, refillId: 0, dimId: 0 }

function clickMug(c: Coffee): Coffee {
  if (c.level > 0) {
    const level = c.level - 1
    const firstSip = c.sipId === 0
    const note = level === 0 ? 'coffeeEmpty' : firstSip ? 'coffeeFact' : 'coffeeSip'
    return { ...c, level, note, noteId: c.noteId + 1, sipId: c.sipId + 1 }
  }
  const refills = c.refills + 1
  const reward = refills === REWARD_REFILL
  return {
    ...c,
    level: SIPS_PER_CUP,
    refills,
    note: reward ? 'coffeeReward' : 'coffeeRefill',
    noteId: c.noteId + 1,
    refillId: c.refillId + 1,
    dimId: reward ? c.dimId + 1 : c.dimId,
  }
}

/** The coffee mug easter egg: sip until empty, refill, and the third refill leads to the contact section. */
export function useCoffee() {
  const [coffee, setCoffee] = useState(initial)
  const { note, noteId } = coffee

  // The reward note stays until the next click, since it holds a link.
  useEffect(() => {
    if (!note || note === 'coffeeReward') return
    const t = window.setTimeout(() => setCoffee((c) => ({ ...c, note: null })), NOTE_MS)
    return () => window.clearTimeout(t)
  }, [note, noteId])

  const onMugClick = useCallback(() => setCoffee(clickMug), [])
  const dismissNote = useCallback(() => setCoffee((c) => (c.note ? { ...c, note: null } : c)), [])

  return { coffee, onMugClick, dismissNote }
}
