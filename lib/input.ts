'use client'

export const keys: Record<string, boolean> = {}

/**
 * joystick state - values -1..1
 */
export const joystick = { x: 0, y: 0 }

export function setKey(code: string, value: boolean) {
  keys[code] = value
}

export function setJoy(x: number, y: number) {
  joystick.x = Math.max(-1, Math.min(1, x))
  joystick.y = Math.max(-1, Math.min(1, y))
  // Map joystick to WASD/Arrows so existing controls work
  keys['KeyA'] = joystick.x < -0.35
  keys['KeyD'] = joystick.x > 0.35
  keys['ArrowLeft'] = keys['KeyA']
  keys['ArrowRight'] = keys['KeyD']
  keys['KeyW'] = joystick.y > 0.35
  keys['KeyS'] = joystick.y < -0.35
  keys['ArrowUp'] = keys['KeyW']
  keys['ArrowDown'] = keys['KeyS']
}

export function resetKeys() {
  for (const k of Object.keys(keys)) keys[k] = false
  setJoy(0, 0)
}

export function initKeyboardListeners() {
  if (typeof window === 'undefined') return () => {}
  const down = (e: KeyboardEvent) => {
    keys[e.code] = true
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
  }
  const up = (e: KeyboardEvent) => {
    keys[e.code] = false
  }
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
  }
}
