'use client'

import { Canvas } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { City } from './city'
import { Player } from './player'
import { Drones } from './drones'
import { Shards } from './shards'
import { Hud } from './hud'

export default function Game() {
  return (
    <div className="relative h-dvh w-full bg-background">
      <Canvas
        camera={{ position: [0, 20, -12], fov: 70, near: 0.1, far: 400 }}
        gl={{ antialias: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#05030c']} />
        <fog attach="fog" args={['#05030c', 40, 220]} />
        <ambientLight intensity={0.7} color="#5560cc" />
        <hemisphereLight args={['#3a3a80', '#12081f', 0.9]} />
        <directionalLight position={[30, 60, -20]} intensity={1.4} color="#8a70ff" />

        <Grid
          position={[0, 0.02, 0]}
          infiniteGrid
          cellSize={7}
          sectionSize={56}
          cellColor="#1a1a3a"
          sectionColor="#00f0ff"
          fadeDistance={220}
          fadeStrength={2}
          followCamera
        />

        <City />
        <Shards />
        <Drones />
        <Player />

        <EffectComposer>
          <Bloom intensity={1.1} luminanceThreshold={1} mipmapBlur />
          <Vignette darkness={0.7} offset={0.3} />
        </EffectComposer>
      </Canvas>
      <Hud />
    </div>
  )
}
