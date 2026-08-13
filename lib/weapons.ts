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
export let lastBulletTime = 0

export function spawnBullet(x: number, y: number, z: number, vx: number, vy: number, vz: number, life = 3) {
  const b = { x, y, z, vx, vy, vz, life }
  bullets.push(b)
  lastBulletTime = Date.now()
  // expose for quick console inspection in dev
  try {
    ;(window as any).__bullets = bullets
  } catch (e) {}
  // console for telemetry
  if (typeof console !== 'undefined') console.debug('[spawnBullet]', b)
  // dispatch an event so player can show muzzle flash
  try {
    const ev = new CustomEvent('game:spawnBullet', { detail: { x, y, z } })
    window.dispatchEvent(ev)
  } catch (e) {}
}
