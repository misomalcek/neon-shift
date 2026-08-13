'use client'

export type Bullet = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
}

// Simple global bullets array. Drones component updates physics and handles collisions.
export const bullets: Bullet[] = []

export function spawnBullet(x: number, y: number, z: number, vx: number, vy: number, vz: number, life = 2) {
  bullets.push({ x, y, z, vx, vy, vz, life })
}
