'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, world } from '@/lib/game-store'
import { CHUNK_SIZE, buildingAt, sectorName } from '@/lib/procgen'

const CRUISE = 16
const BOOST = 34
const TURN = 1.9
const CLIMB = 14

export function Player() {
  const group = useRef<THREE.Group>(null)
  const keys = useRef<Record<string, boolean>>({})
  const camera = useThree((s) => s.camera)
  const setSpeed = useGame((s) => s.setSpeed)
  const setSector = useGame((s) => s.setSector)
  const started = useGame((s) => s.started)

  const camTarget = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  const lastSector = useRef('')
  const speedRef = useRef(CRUISE)
  const bank = useRef(0)
  const pitch = useRef(0)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    }
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = group.current
    if (!g || !started) return
    const k = keys.current

    // Steering
    const turnInput = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0)
    const climbInput = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
    const boosting = k.ShiftLeft || k.ShiftRight || k.Space

    world.heading += turnInput * TURN * dt
    const targetSpeed = (boosting ? BOOST : CRUISE) + world.boost
    speedRef.current = THREE.MathUtils.damp(speedRef.current, targetSpeed, 3, dt)
    world.boost = Math.max(0, world.boost - dt * 10)

    // Move forward along heading
    const dirX = Math.sin(world.heading)
    const dirZ = Math.cos(world.heading)
    const nx = world.playerPos.x + dirX * speedRef.current * dt
    const nz = world.playerPos.z + dirZ * speedRef.current * dt

    // Deterministic building collision — glance off towers you fly into
    const hit = buildingAt(nx, nz)
    if (hit && world.playerPos.y < hit.h + 1) {
      speedRef.current = Math.max(6, speedRef.current * 0.4)
      world.boost = 0
      // push away from building center
      const px = world.playerPos.x - hit.x
      const pz = world.playerPos.z - hit.z
      const len = Math.hypot(px, pz) || 1
      world.playerPos.x += (px / len) * 14 * dt
      world.playerPos.z += (pz / len) * 14 * dt
    } else {
      world.playerPos.x = nx
      world.playerPos.z = nz
    }
    world.playerPos.y = THREE.MathUtils.clamp(
      world.playerPos.y + climbInput * CLIMB * dt,
      3.5,
      70
    )

    g.position.set(world.playerPos.x, world.playerPos.y, world.playerPos.z)
    g.rotation.y = world.heading

    // Banking and pitching for feel
    bank.current = THREE.MathUtils.damp(bank.current, turnInput * 0.55, 5, dt)
    pitch.current = THREE.MathUtils.damp(pitch.current, -climbInput * 0.3, 5, dt)
    g.rotation.z = bank.current
    g.rotation.x = pitch.current

    // Chase camera
    const camDist = 11 + (speedRef.current - CRUISE) * 0.12
    camTarget.set(
      world.playerPos.x - dirX * camDist,
      world.playerPos.y + 4.5,
      world.playerPos.z - dirZ * camDist
    )
    camera.position.lerp(camTarget, 1 - Math.exp(-4 * dt))
    lookTarget.set(
      world.playerPos.x + dirX * 8,
      world.playerPos.y + 1,
      world.playerPos.z + dirZ * 8
    )
    camera.lookAt(lookTarget)

    // HUD updates (throttled by value change)
    const spd = Math.round(speedRef.current * 10)
    if (Math.abs(useGame.getState().speed - spd) > 4) setSpeed(spd)
    const cx = Math.floor(world.playerPos.x / CHUNK_SIZE)
    const cz = Math.floor(world.playerPos.z / CHUNK_SIZE)
    const sec = sectorName(cx, cz)
    if (sec !== lastSector.current) {
      lastSector.current = sec
      setSector(sec)
    }
  })

  return (
    <group ref={group} position={[0, 16, 0]}>
      {/* Hover glider */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.7, 2.6, 4]} />
        <meshStandardMaterial color="#0a0a14" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, -0.1, -0.5]}>
        <boxGeometry args={[3.2, 0.08, 0.9]} />
        <meshStandardMaterial color="#0a0a14" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Neon trims */}
      <mesh position={[1.6, -0.1, -0.5]}>
        <boxGeometry args={[0.12, 0.12, 0.95]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={4} />
      </mesh>
      <mesh position={[-1.6, -0.1, -0.5]}>
        <boxGeometry args={[0.12, 0.12, 0.95]} />
        <meshStandardMaterial color="#ff2d95" emissive="#ff2d95" emissiveIntensity={4} />
      </mesh>
      {/* Engine glow */}
      <mesh position={[0, 0, -1.5]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={6} />
      </mesh>
      <pointLight position={[0, 0, -1.5]} color="#00f0ff" intensity={12} distance={14} />
    </group>
  )
}
