'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bullets } from '@/lib/weapons'

const dummy = new THREE.Object3D()

export function Bullets() {
  const mesh = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const count = Math.min(bullets.length, 128)
    for (let i = 0; i < count; i++) {
      const b = bullets[i]
      dummy.position.set(b.x, b.y, b.z)
      dummy.scale.setScalar(0.3)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.count = count
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 128]} frustumCulled={false}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshBasicMaterial toneMapped={false} color="#ffd966" />
    </instancedMesh>
  )
}
