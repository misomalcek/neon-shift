// Deterministic procedural generation utilities.
// Same coordinates always produce the same world, forever, in every direction.

export function hash2(x: number, z: number, seed = 1337): number {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = h ^ (h >>> 16)
  return (h >>> 0) / 4294967295
}

export const CHUNK_SIZE = 56
export const CELLS = 4 // 4x4 building cells per chunk
export const VIEW_CHUNKS = 3 // radius of chunks kept alive around the player

export type Building = {
  x: number
  z: number
  w: number
  d: number
  h: number
  neon: number // palette index
  hasSpire: boolean
}

export type ChunkData = {
  key: string
  cx: number
  cz: number
  buildings: Building[]
}

export const NEON_PALETTE = ['#00f0ff', '#ff2d95', '#ffb300'] as const

export function generateChunk(cx: number, cz: number): ChunkData {
  const buildings: Building[] = []
  const cell = CHUNK_SIZE / CELLS
  for (let i = 0; i < CELLS; i++) {
    for (let j = 0; j < CELLS; j++) {
      const gx = cx * CELLS + i
      const gz = cz * CELLS + j
      const r = hash2(gx, gz)
      if (r < 0.22) continue // empty lot / plaza
      const r2 = hash2(gx, gz, 7331)
      const r3 = hash2(gx, gz, 9001)
      const r4 = hash2(gx, gz, 4242)
      // District height bias: slow noise makes downtown cores emerge
      const district = hash2(Math.floor(gx / 6), Math.floor(gz / 6), 555)
      const h = 6 + r2 * r2 * 34 + district * district * 46
      buildings.push({
        x: cx * CHUNK_SIZE + (i + 0.5) * cell,
        z: cz * CHUNK_SIZE + (j + 0.5) * cell,
        w: 4 + r3 * (cell - 8),
        d: 4 + r4 * (cell - 8),
        h,
        neon: Math.floor(hash2(gx, gz, 111) * NEON_PALETTE.length),
        hasSpire: h > 44 && r < 0.5,
      })
    }
  }
  return { key: `${cx},${cz}`, cx, cz, buildings }
}

// Deterministic collision: re-derive the building (if any) occupying a world position.
export function buildingAt(x: number, z: number): Building | null {
  const cell = CHUNK_SIZE / CELLS
  const gx = Math.floor(x / cell)
  const gz = Math.floor(z / cell)
  const r = hash2(gx, gz)
  if (r < 0.22) return null
  const r2 = hash2(gx, gz, 7331)
  const r3 = hash2(gx, gz, 9001)
  const r4 = hash2(gx, gz, 4242)
  const district = hash2(Math.floor(gx / 6), Math.floor(gz / 6), 555)
  const h = 6 + r2 * r2 * 34 + district * district * 46
  const b: Building = {
    x: (gx + 0.5) * cell,
    z: (gz + 0.5) * cell,
    w: 4 + r3 * (cell - 8),
    d: 4 + r4 * (cell - 8),
    h,
    neon: Math.floor(hash2(gx, gz, 111) * NEON_PALETTE.length),
    hasSpire: h > 44 && r < 0.5,
  }
  if (Math.abs(x - b.x) > b.w / 2 || Math.abs(z - b.z) > b.d / 2) return null
  return b
}

// Sector naming — every chunk belongs to a named district, generated, infinite.
const SYL_A = ['NEO', 'KUR', 'VOX', 'ZAI', 'HEX', 'RYU', 'OMN', 'DAT', 'SYN', 'KRA']
const SYL_B = ['SHIMA', 'GRAD', 'TOWN', 'BLOK', 'WARD', 'DYNE', 'PORT', 'LINE', 'CORE', 'DEN']

export function sectorName(cx: number, cz: number): string {
  const sx = Math.floor(cx / 4)
  const sz = Math.floor(cz / 4)
  const a = SYL_A[Math.floor(hash2(sx, sz, 21) * SYL_A.length)]
  const b = SYL_B[Math.floor(hash2(sx, sz, 42) * SYL_B.length)]
  const n = Math.floor(hash2(sx, sz, 63) * 90) + 10
  return `${a}-${b} ${n}`
}

// Data shards: deterministic spawn points on a fine grid, spawned near the player.
export const SHARD_CELL = 30

export function shardAt(ix: number, iz: number): { x: number; y: number; z: number } | null {
  const r = hash2(ix, iz, 8080)
  if (r < 0.72) return null // ~28% of cells hold a shard
  const ox = hash2(ix, iz, 8181) - 0.5
  const oz = hash2(ix, iz, 8282) - 0.5
  const y = 8 + hash2(ix, iz, 8383) * 30
  return {
    x: (ix + 0.5 + ox * 0.8) * SHARD_CELL,
    y,
    z: (iz + 0.5 + oz * 0.8) * SHARD_CELL,
  }
}
