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

// Elige un tipo de moneda considerando rarityBonus del arma
export function pickCoinType(
  definitions: CoinDefinition[],
  rarityBonus: number,
): CoinTypeId {
  const adjusted = definitions.map((def) => ({
    ...def,
    probability: def.isSpecial
      ? def.probability * (1 + rarityBonus * 2)
      : def.probability,
  }))
  return weightedRandom(adjusted).id
}

// ── Ángulo de dispersión ─────────────────────────────────────

// Devuelve un ángulo desviado del base dentro de ±spread/2 radianes
export function spreadAngle(baseAngle: number, spread: number): number {
  return baseAngle + randomFloat(-spread / 2, spread / 2)
}
