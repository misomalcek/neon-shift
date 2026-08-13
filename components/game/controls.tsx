'use client'

import { useEffect, useRef, useState } from 'react'
import { setKey, setJoy } from '@/lib/input'
import { useGame, world } from '@/lib/game-store'
import { spawnBullet } from '@/lib/weapons'

export function Controls() {
  const padRef = useRef<HTMLDivElement | null>(null)
  const activeRef = useRef<number | null>(null)
  const [visible, setVisible] = useState(false)
  const start = useGame((s) => s.start)
  const started = useGame((s) => s.started)
  const firingRef = useRef(false)
  const fireLoopRef = useRef<number | null>(null)

  // Show controls on touch devices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVisible('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (fireLoopRef.current != null) {
        clearInterval(fireLoopRef.current)
        fireLoopRef.current = null
      }
    }
  }, [])

  // Helper: convert pointer pos to -1..1 inside pad
  const updateJoyFromPointer = (clientX: number, clientY: number) => {
    const el = padRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const rx = (clientX - cx) / (rect.width / 2)
    const ry = -(clientY - cy) / (rect.height / 2)
    // clamp
    const nx = Math.max(-1, Math.min(1, rx))
    const ny = Math.max(-1, Math.min(1, ry))
    setJoy(nx, ny)
  }

  const onPointerDownPad = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    activeRef.current = e.pointerId
    updateJoyFromPointer(e.clientX, e.clientY)
  }
  const onPointerMovePad = (e: React.PointerEvent) => {
    if (activeRef.current !== e.pointerId) return
    updateJoyFromPointer(e.clientX, e.clientY)
  }
  const onPointerUpPad = (e: React.PointerEvent) => {
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    activeRef.current = null
    setJoy(0, 0)
  }

  const onBoostDown = () => setKey('ShiftLeft', true)
  const onBoostUp = () => setKey('ShiftLeft', false)

  const doFireOnce = () => {
    if (!started) return
    const dirX = Math.sin(world.heading)
    const dirZ = Math.cos(world.heading)
    const bx = world.playerPos.x + dirX * 2
    const by = world.playerPos.y
    const bz = world.playerPos.z + dirZ * 2
    const speed = 80
    spawnBullet(bx, by, bz, dirX * speed, 0, dirZ * speed, 2)
    // tactile muzzle bump
    world.boost = Math.min(12, world.boost + 0.6)
  }

  const startAutoFire = () => {
    if (firingRef.current) return
    firingRef.current = true
    doFireOnce()
    fireLoopRef.current = window.setInterval(doFireOnce, 180)
  }
  const stopAutoFire = () => {
    firingRef.current = false
    if (fireLoopRef.current != null) {
      clearInterval(fireLoopRef.current)
      fireLoopRef.current = null
    }
  }

  const onFireDown = () => startAutoFire()
  const onFireUp = () => stopAutoFire()

  const onStart = () => {
    // if not started, start the game; otherwise toggle pause via start/stop
    if (!started) start()
    else start()
  }

  if (!visible) return null

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 right-4 flex items-end justify-between px-6">
      <div
        ref={padRef}
        onPointerDown={onPointerDownPad}
        onPointerMove={onPointerMovePad}
        onPointerUp={onPointerUpPad}
        onPointerCancel={onPointerUpPad}
        className="h-32 w-32 rounded-full bg-white/6 backdrop-blur-md border border-white/6 touch-none"
        style={{ touchAction: 'none' }}
      />
      <div className="flex flex-col gap-3 items-end">
        <button
          onPointerDown={onBoostDown}
          onPointerUp={onBoostUp}
          onPointerCancel={onBoostUp}
          className="h-12 w-20 rounded bg-primary/90 text-primary-foreground font-semibold"
        >
          BOOST
        </button>
        <button
          onPointerDown={onFireDown}
          onPointerUp={onFireUp}
          onPointerCancel={onFireUp}
          className="h-12 w-20 rounded bg-accent/90 text-accent-foreground font-semibold"
        >
          FIRE
        </button>
        <button onClick={onStart} className="h-10 w-20 rounded border border-primary text-sm">
          START
        </button>
      </div>
    </div>
  )
}
