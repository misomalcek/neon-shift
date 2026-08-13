'use client'

import { create } from 'zustand'

type GameState = {
  shards: number
  best: number
  heat: number // 0..1 — how agitated the drone swarm / enemies are
  speed: number
  sector: string
  hits: number
  started: boolean
  health: number
  maxHealth: number
  phase: 'intro' | 'playing' | 'level_complete'
  level: number
  collect: () => void
  loseShard: () => void
  setHeat: (h: number) => void
  setSpeed: (s: number) => void
  setSector: (s: string) => void
  start: () => void
  takeDamage: (d: number) => void
  registerKill: (score?: number) => void
}

export const useGame = create<GameState>((set, get) => ({
  shards: 0,
  best: 0,
  heat: 0,
  speed: 0,
  sector: '',
  hits: 0,
  started: false,
  health: 100,
  maxHealth: 100,
  phase: 'intro',
  level: 1,
  collect: () =>
    set((s) => ({ shards: s.shards + 1, best: Math.max(s.best, s.shards + 1) })),
  loseShard: () => set((s) => ({ shards: Math.max(0, s.shards - 2), hits: s.hits + 1 })),
  setHeat: (heat) => set({ heat }),
  setSpeed: (speed) => set({ speed }),
  setSector: (sector) => set({ sector }),
  start: () => set({ started: true, phase: 'playing' }),
  takeDamage: (d: number) => {
    set((s) => {
      const next = Math.max(0, s.health - d)
      if (next === 0) {
        // on death, move to intro and reset some state
        return { health: 0, started: false, phase: 'intro' }
      }
      return { health: next }
    })
  },
  registerKill: (score = 1) =>
    set((s) => ({ shards: s.shards + score, best: Math.max(s.best, s.shards + score) })),
}))

// Mutable per-frame world state shared between systems without re-renders.
export const world = {
  playerPos: { x: 0, y: 16, z: 0 },
  playerVel: { x: 0, y: 0, z: 0 },
  heading: 0,
  boost: 0,
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { __v0World: typeof world }).__v0World = world
}
