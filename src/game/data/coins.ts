import type { CoinDefinition } from '../types/game'

export const COIN_DEFINITIONS: CoinDefinition[] = [
  {
    id: 'normal_coin',
    value: 1,
    probability: 60,
    visualAsset: 'coin_normal',
    isSpecial: false,
  },
  {
    id: 'silver_coin',
    value: 5,
    probability: 22,
    visualAsset: 'coin_silver',
    isSpecial: false,
  },
  {
    id: 'gold_coin',
    value: 10,
    probability: 10,
    visualAsset: 'coin_gold',
    isSpecial: false,
  },
  {
    id: 'money_bill',
    value: 25,
    probability: 5,
    visualAsset: 'coin_bill',
    isSpecial: false,
  },
  {
    id: 'gem',
    value: 100,
    probability: 0.5,
    visualAsset: 'coin_gem',
    isSpecial: false,
  },
  {
    id: 'multiplier_coin',
    value: 0,
    probability: 1,
    visualAsset: 'coin_multiplier',
    isSpecial: true,   // activa x2 temporal
  },
  {
    id: 'magnet_coin',
    value: 0,
    probability: 0.8,
    visualAsset: 'coin_magnet',
    isSpecial: true,   // atrae monedas cercanas hacia la caja
  },
  {
    id: 'bomb_coin',
    value: 0,
    probability: 0.7,
    visualAsset: 'coin_bomb',
    isSpecial: true,   // empuja monedas cercanas
  },
]

export const COIN_MAP = new Map(COIN_DEFINITIONS.map((c) => [c.id, c]))

// Duración en ms de los efectos especiales
export const SPECIAL_COIN_DURATIONS = {
  multiplier_coin: 5000,
  magnet_coin: 4000,
  bomb_coin: 0,        // instantáneo
} as const

// Duración de vida máxima de una moneda en pantalla (ms)
export const COIN_LIFETIME_MS = 6000
