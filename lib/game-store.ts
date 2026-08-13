import { create } from 'zustand'

type GameState = {
  shards: number
  best: number
  heat: number // 0..1 — how agitated the drone swarm is
  speed: number
  sector: string
  hits: number
  started: boolean
  collect: () => void
  loseShard: () => void
  setHeat: (h: number) => void
  setSpeed: (s: number) => void
  setSector: (s: string) => void
  start: () => void
}

export const useGame = create<GameState>((set) => ({
  shards: 0,
  best: 0,
  heat: 0,
  speed: 0,
  sector: '',
  hits: 0,
  started: false,
  collect: () =>
    set((s) => ({ shards: s.shards + 1, best: Math.max(s.best, s.shards + 1) })),
  loseShard: () =>
    set((s) => ({ shards: Math.max(0, s.shards - 2), hits: s.hits + 1 })),
  setHeat: (heat) => set({ heat }),
  setSpeed: (speed) => set({ speed }),
  setSector: (sector) => set({ sector }),
  start: () => set({ started: true }),
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
