'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SHARD_CELL, shardAt } from '@/lib/procgen'
import { useGame, world } from '@/lib/game-store'

const MAX = 64
const VIEW = 5 // shard cells radius around the player
const dummy = new THREE.Object3D()
const cyan = new THREE.Color('#00ffe1').multiplyScalar(3)

export function Shards() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const collected = useMemo(() => new Set<string>(), [])
  const collect = useGame((s) => s.collect)

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const p = world.playerPos
    const pix = Math.floor(p.x / SHARD_CELL)
    const piz = Math.floor(p.z / SHARD_CELL)
    const t = state.clock.elapsedTime
    let count = 0

    for (let i = -VIEW; i <= VIEW && count < MAX; i++) {
      for (let j = -VIEW; j <= VIEW && count < MAX; j++) {
        const ix = pix + i
        const iz = piz + j
        const key = `${ix},${iz}`
        if (collected.has(key)) continue
        const s = shardAt(ix, iz)
        if (!s) continue

        // Collect check
        const dx = s.x - p.x
        const dy = s.y - p.y
        const dz = s.z - p.z
        if (dx * dx + dy * dy + dz * dz < 12) {
          collected.add(key)
          collect()
          world.boost = 10 // little speed rush on pickup
          continue
        }

        dummy.position.set(s.x, s.y + Math.sin(t * 2 + ix * 3 + iz) * 0.6, s.z)
        dummy.rotation.set(0, t * 1.5 + ix + iz, 0)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        m.setMatrixAt(count, dummy.matrix)
        m.setColorAt(count, cyan)
        count++
      }
    }
    m.count = count
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <octahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
