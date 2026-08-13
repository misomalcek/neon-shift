'use client'

export type Flash = {
  x: number
  y: number
  z: number
  life: number
  age: number
}

export const flashes: Flash[] = []

export function spawnFlash(x: number, y: number, z: number, life = 0.35) {
  flashes.push({ x, y, z, life, age: 0 })
}
