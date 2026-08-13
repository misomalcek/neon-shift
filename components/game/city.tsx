'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CHUNK_SIZE,
  VIEW_CHUNKS,
  generateChunk,
  NEON_PALETTE,
  type ChunkData,
} from '@/lib/procgen'
import { world } from '@/lib/game-store'

const dummy = new THREE.Object3D()
const colorTmp = new THREE.Color()

function Chunk({ data }: { data: ChunkData }) {
  const bodies = useRef<THREE.InstancedMesh>(null)
  const trims = useRef<THREE.InstancedMesh>(null)

  const counts = useMemo(() => {
    const n = data.buildings.length
    return { bodies: n, trims: n + data.buildings.filter((b) => b.hasSpire).length }
  }, [data])

  useMemo(() => {
    // populated on first render via ref callback below
  }, [])

  const setup = () => {
    const bm = bodies.current
    const tm = trims.current
    if (!bm || !tm) return
    let ti = 0
    data.buildings.forEach((b, i) => {
      // Body
      dummy.position.set(b.x, b.h / 2, b.z)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      bm.setMatrixAt(i, dummy.matrix)

      const neon = colorTmp.set(NEON_PALETTE[b.neon]).multiplyScalar(2.4)
      // Roof trim ring
      dummy.position.set(b.x, b.h + 0.15, b.z)
      dummy.scale.set(b.w + 0.4, 0.3, b.d + 0.4)
      dummy.updateMatrix()
      tm.setMatrixAt(ti, dummy.matrix)
      tm.setColorAt(ti, neon)
      ti++
      // Spire antenna on tall towers
      if (b.hasSpire) {
        dummy.position.set(b.x, b.h + 4, b.z)
        dummy.scale.set(0.25, 8, 0.25)
        dummy.updateMatrix()
        tm.setMatrixAt(ti, dummy.matrix)
        tm.setColorAt(ti, colorTmp.set('#ff2d95').multiplyScalar(2.4))
        ti++
      }
    })
    bm.instanceMatrix.needsUpdate = true
    tm.instanceMatrix.needsUpdate = true
    if (tm.instanceColor) tm.instanceColor.needsUpdate = true
    bm.computeBoundingSphere()
    tm.computeBoundingSphere()
  }

  return (
    <group>
      <instancedMesh
        ref={(m) => {
          bodies.current = m
          if (m && trims.current) setup()
        }}
        args={[undefined, undefined, counts.bodies]}
      >
        <boxGeometry />
        <meshStandardMaterial color="#232338" metalness={0.4} roughness={0.55} emissive="#0d0d22" emissiveIntensity={0.6} />
      </instancedMesh>
      <instancedMesh
        ref={(m) => {
          trims.current = m
          if (m && bodies.current) setup()
        }}
        args={[undefined, undefined, counts.trims]}
      >
        <boxGeometry />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export function City() {
  const [chunks, setChunks] = useState<ChunkData[]>([])
  const lastCenter = useRef('')

  useFrame(() => {
    const cx = Math.floor(world.playerPos.x / CHUNK_SIZE)
    const cz = Math.floor(world.playerPos.z / CHUNK_SIZE)
    const key = `${cx},${cz}`
    if (key === lastCenter.current) return
    lastCenter.current = key
    const next: ChunkData[] = []
    for (let i = -VIEW_CHUNKS; i <= VIEW_CHUNKS; i++) {
      for (let j = -VIEW_CHUNKS; j <= VIEW_CHUNKS; j++) {
        next.push(generateChunk(cx + i, cz + j))
      }
    }
    setChunks(next)
  })

  return (
    <group>
      {chunks.map((c) => (
        <Chunk key={c.key} data={c} />
      ))}
    </group>
  )
}
