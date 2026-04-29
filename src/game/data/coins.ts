import type { CoinDefinition } from '../types/game'

// Probabilidades base (rarityBonus = 0, golpe débil sin combo):
//   coin_silver ~55 % · coin_gold ~30 % · bill_blue ~10 % · bill_green ~4 % · bill_pink ~1 %
// Con rarityBonus máximo (fiebre + golpe fuerte):
//   bill_green sube a ~13 % · bill_pink sube a ~7 %
export const COIN_DEFINITIONS: CoinDefinition[] = [
  {
    id: 'coin_silver',
    value: 1,
    probability: 55,
    visualAsset: 'coin_silver',
    rarityWeight: 0,
  },
  {
    id: 'coin_gold',
    value: 2,
    probability: 30,
    visualAsset: 'coin_gold',
    rarityWeight: 0,
  },
  {
    id: 'bill_blue',
    value: 5,
    probability: 10,
    visualAsset: 'bill_blue',
    rarityWeight: 0,
  },
  {
    id: 'bill_green',
    value: 10,
    probability: 4,
    visualAsset: 'bill_green',
    rarityWeight: 3,
  },
  {
    id: 'bill_pink',
    value: 20,
    probability: 1,
    visualAsset: 'bill_pink',
    rarityWeight: 8,
  },
]

export const COIN_MAP = new Map(COIN_DEFINITIONS.map((c) => [c.id, c]))

// Duración de vida máxima de una moneda en pantalla (ms)
export const COIN_LIFETIME_MS = 6000
