'use client'

export const keys: Record<string, boolean> = {}

export function setKey(code: string, value: boolean) {
  keys[code] = value
}

export function resetKeys() {
  for (const k of Object.keys(keys)) keys[k] = false
}

export function initKeyboardListeners() {
  if (typeof window === 'undefined') return
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
