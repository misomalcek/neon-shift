'use client'

import { useGame } from '@/lib/game-store'

export function Hud() {
  const shards = useGame((s) => s.shards)
  const best = useGame((s) => s.best)
  const heat = useGame((s) => s.heat)
  const speed = useGame((s) => s.speed)
  const sector = useGame((s) => s.sector)
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)

  if (!started) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-background/80 p-6 text-center font-mono">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-primary text-balance">SIGNAL//RUNNER</h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            An infinite generated city. Harvest data shards.
            <br />
            The more you carry, the louder your signal —<br />
            and the swarm is listening.
          </p>
        </div>
        <div className="text-xs text-muted-foreground leading-6">
          <p>
            <span className="text-foreground">A / D</span> steer &nbsp;·&nbsp;{' '}
            <span className="text-foreground">W / S</span> climb / dive
          </p>
          <p>
            <span className="text-foreground">SHIFT</span> boost
          </p>
        </div>
        <button
          onClick={start}
          className="border border-primary bg-primary/10 px-8 py-3 text-sm tracking-[0.3em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          JACK IN
        </button>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono text-xs">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3">
        <div className="text-primary">
          <p className="text-[10px] text-muted-foreground">SECTOR</p>
          <p className="tracking-widest">{sector || '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">SHARDS</p>
          <p className="text-lg leading-none text-accent">{shards}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">BEST {best}</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-3">
        <div>
          <p className="text-[10px] text-muted-foreground">VELOCITY</p>
          <p className="text-primary">{speed}</p>
        </div>
        <div className="w-28">
          <p className="mb-1 text-right text-[10px] text-muted-foreground">
            SWARM HEAT {heat > 0.5 ? '!! HUNTED !!' : ''}
          </p>
          <div className="h-1.5 w-full border border-border bg-card">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.round(heat * 100)}%`,
                background: heat > 0.5 ? 'var(--destructive)' : 'var(--primary)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
