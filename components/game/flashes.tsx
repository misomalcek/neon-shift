'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { flashes } from '@/lib/effects'

const dummy = new THREE.Object3D()

export function Flashes() {
  const mesh = useRef<THREE.InstancedMesh>(null)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const m = mesh.current
    if (!m) return
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]
      f.age += dt
      if (f.age >= f.life) flashes.splice(i, 1)
    }
    const count = Math.min(flashes.length, 64)
    for (let i = 0; i < count; i++) {
      const f = flashes[i]
      const t = Math.max(0, 1 - f.age / f.life)
      dummy.position.set(f.x, f.y, f.z)
      const s = 0.4 + t * 0.8
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      const col = new THREE.Color('#ffd966').multiplyScalar(1 + t * 2)
      m.setColorAt(i, col)
    }
    m.count = Math.min(flashes.length, 64)
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 64]} frustumCulled={false}>
      <sphereGeometry args={[0.3, 6, 6]} />
      <meshBasicMaterial toneMapped={false} vertexColors={true} transparent opacity={0.95} />
    </instancedMesh>
  )
}
