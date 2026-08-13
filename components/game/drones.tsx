'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, world } from '@/lib/game-store'
import { bullets } from '@/lib/weapons'

const COUNT = 42
const RANGE = 130 // drones live inside this radius of the player, wrapping around
const dummy = new THREE.Object3D()
const calm = new THREE.Color('#00f0ff').multiplyScalar(1.6)
const angry = new THREE.Color('#ff2040').multiplyScalar(2.4)
const mix = new THREE.Color()

type Drone = {
  pos: THREE.Vector3
  vel: THREE.Vector3
  agitation: number // 0 calm wanderer .. 1 hunter — spreads between neighbors
}

export function Drones() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const setHeat = useGame((s) => s.setHeat)
  const loseShard = useGame((s) => s.loseShard)
  const registerKill = useGame((s) => s.registerKill)
  const hitCooldown = useRef(0)

  const drones = useMemo<Drone[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        pos: new THREE.Vector3(
          (Math.sin(i * 12.9898) * 0.5 + 0.5) * RANGE * 2 - RANGE,
          10 + (Math.sin(i * 78.233) * 0.5 + 0.5) * 35,
          (Math.sin(i * 39.425) * 0.5 + 0.5) * RANGE * 2 - RANGE
        ),
        vel: new THREE.Vector3(Math.sin(i), 0, Math.cos(i)).multiplyScalar(6),
        agitation: 0,
      })),
    []
  )

  const steer = useMemo(() => new THREE.Vector3(), [])
  const diff = useMemo(() => new THREE.Vector3(), [])
  const center = useMemo(() => new THREE.Vector3(), [])
  const avgVel = useMemo(() => new THREE.Vector3(), [])
  const playerV = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const m = mesh.current
    if (!m) return
    const p = world.playerPos
    playerV.set(p.x, p.y, p.z)
    hitCooldown.current = Math.max(0, hitCooldown.current - dt)

    // Update bullets physics here so collisions are deterministic in the same loop
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.z += b.vz * dt
      b.life -= dt
      if (b.life <= 0) bullets.splice(i, 1)
    }

    const shards = useGame.getState().shards
    // Carrying more shards makes you "louder" — drones sense you from farther away.
    const senseRadius = 18 + Math.min(shards, 20) * 2.2
    let totalAgitation = 0

    for (let i = 0; i < COUNT; i++) {
      const d = drones[i]
      steer.set(0, 0, 0)
      center.set(0, 0, 0)
      avgVel.set(0, 0, 0)
      let neighbors = 0
      let neighborAgitation = 0

      for (let j = 0; j < COUNT; j++) {
        if (i === j) continue
        const o = drones[j]
        const distSq = d.pos.distanceToSquared(o.pos)
        if (distSq < 400) {
          neighbors++
          neighborAgitation = Math.max(neighborAgitation, o.agitation)
          center.add(o.pos)
          avgVel.add(o.vel)
          if (distSq < 36) {
            // separation
            diff.subVectors(d.pos, o.pos).normalize().multiplyScalar(14 / (Math.sqrt(distSq) + 0.1))
            steer.add(diff)
          }
        }
      }
      if (neighbors > 0) {
        center.divideScalar(neighbors)
        steer.add(diff.subVectors(center, d.pos).multiplyScalar(0.04)) // cohesion
        steer.add(avgVel.divideScalar(neighbors).sub(d.vel).multiplyScalar(0.08)) // alignment
      }

      // Sense the player
      const pd = d.pos.distanceTo(playerV)
      if (pd < senseRadius) {
        d.agitation = Math.min(1, d.agitation + dt * 1.2)
      } else {
        d.agitation = Math.max(0, d.agitation - dt * 0.15)
      }
      // Agitation is contagious — panic ripples through the swarm (emergence)
      if (neighborAgitation > d.agitation) {
        d.agitation = Math.min(neighborAgitation, d.agitation + dt * 0.8)
      }

      // Hunters chase; calm drones wander on noise
      if (d.agitation > 0.4) {
        diff.subVectors(playerV, d.pos).normalize().multiplyScalar(10 * d.agitation)
        steer.add(diff)
      } else {
        const t = state.clock.elapsedTime * 0.3 + i
        steer.x += Math.sin(t) * 1.4
        steer.z += Math.cos(t * 0.9) * 1.4
        steer.y += Math.sin(t * 0.6) * 0.6
      }

      // Altitude band
      if (d.pos.y < 6) steer.y += 6
      if (d.pos.y > 50) steer.y -= 6

      d.vel.addScaledVector(steer, dt)
      const maxSpeed = 8 + d.agitation * 15
      if (d.vel.length() > maxSpeed) d.vel.setLength(maxSpeed)
      d.pos.addScaledVector(d.vel, dt)

      // Wrap around the player so the swarm is infinite too
      if (d.pos.x - p.x > RANGE) d.pos.x -= RANGE * 2
      if (d.pos.x - p.x < -RANGE) d.pos.x += RANGE * 2
      if (d.pos.z - p.z > RANGE) d.pos.z -= RANGE * 2
      if (d.pos.z - p.z < -RANGE) d.pos.z += RANGE * 2

      // Check bullets collisions
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi]
        const dx = d.pos.x - b.x
        const dy = d.pos.y - b.y
        const dz = d.pos.z - b.z
        const dist2 = dx * dx + dy * dy + dz * dz
        if (dist2 < 1.5 * 1.5) {
          // hit
          bullets.splice(bi, 1)
          // register a kill/score
          registerKill(1)
          // knock drone away and calm it
          d.agitation = 0
          d.vel.set(Math.sin(i) * 30, 10, Math.cos(i) * 30)
          break
        }
      }

      // Contact: steal shards and scatter
      if (pd < 2.6 && hitCooldown.current === 0 && useGame.getState().started) {
        hitCooldown.current = 1.2
        loseShard()
        d.agitation = 0
        d.vel.set(Math.sin(i) * 20, 8, Math.cos(i) * 20)
      }

      totalAgitation += d.agitation
      dummy.position.copy(d.pos)
      dummy.lookAt(d.pos.x + d.vel.x, d.pos.y + d.vel.y, d.pos.z + d.vel.z)
      const s = 0.7 + d.agitation * 0.3
      dummy.scale.set(s, s, s * 1.6)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, mix.lerpColors(calm, angry, d.agitation))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true

    const heat = totalAgitation / COUNT
    if (Math.abs(useGame.getState().heat - heat) > 0.04) setHeat(heat)
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <octahedronGeometry args={[0.9, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
