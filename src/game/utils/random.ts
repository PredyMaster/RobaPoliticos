import type { CoinDefinition, CoinTypeId } from '../types/game'

// ── Aleatoriedad básica ──────────────────────────────────────

export function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1))
}

export function randomSign(): number {
  return Math.random() < 0.5 ? -1 : 1
}

export function randomBool(probability: number): boolean {
  return Math.random() < probability
}

// ── Selección ponderada ──────────────────────────────────────

export function weightedRandom<T extends { probability: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.probability, 0)
  let rand = Math.random() * total
  for (const item of items) {
    rand -= item.probability
    if (rand <= 0) return item
  }
  return items[items.length - 1]
}

// El progreso del equipo decide que drops pueden aparecer.
// rarityBonus (0–1) inclina el resultado hacia los drops raros ya desbloqueados.
export function pickCoinType(
  definitions: CoinDefinition[],
  unlockProgress: number,
  rarityBonus: number,
): CoinTypeId {
  const eligible = definitions.filter((def) => unlockProgress >= def.unlockAt)
  const adjusted = (eligible.length > 0 ? eligible : definitions).map((def) => ({
    ...def,
    probability: def.probability * (1 + rarityBonus * def.rarityWeight),
  }))
  return weightedRandom(adjusted).id
}

// ── Ángulo de dispersión ─────────────────────────────────────

// Devuelve un ángulo desviado del base dentro de ±spread/2 radianes
export function spreadAngle(baseAngle: number, spread: number): number {
  return baseAngle + randomFloat(-spread / 2, spread / 2)
}
