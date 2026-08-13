'use client'

import dynamic from 'next/dynamic'

const Game = dynamic(() => import('@/components/game/game'), {
  ssr: false,
  loading: () => (
    <main className="flex h-dvh w-full items-center justify-center bg-background">
      <p className="animate-pulse font-mono text-xs tracking-[0.4em] text-primary">
        BOOTING CITY...
      </p>
    </main>
  ),
})

export default function Page() {
  return (
    <main>
      <Game />
    </main>
  )
}
