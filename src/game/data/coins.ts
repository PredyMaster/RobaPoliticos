import type { CoinDefinition } from '../types/game'

// El equipo controla que tipo de botin puede salir:
//   tier bajo -> solo monedas
//   tier medio -> empiezan los billetes azules
//   tier alto -> entran billetes verdes y rosas con algo de aleatoriedad
export const COIN_DEFINITIONS: CoinDefinition[] = [
  {
    id: 'coin_silver',
    value: 1,
    probability: 70,
    unlockAt: 0,
    visualAsset: 'coin_silver',
    rarityWeight: 0,
  },
  {
    id: 'coin_gold',
    value: 2,
    probability: 30,
    unlockAt: 0,
    visualAsset: 'coin_gold',
    rarityWeight: 0.25,
  },
  {
    id: 'bill_blue',
    value: 5,
    probability: 18,
    unlockAt: 0.3,
    visualAsset: 'bill_blue',
    rarityWeight: 1.4,
  },
  {
    id: 'bill_green',
    value: 10,
    probability: 10,
    unlockAt: 0.6,
    visualAsset: 'bill_green',
    rarityWeight: 2.5,
  },
  {
    id: 'bill_pink',
    value: 20,
    probability: 6,
    unlockAt: 0.82,
    visualAsset: 'bill_pink',
    rarityWeight: 4,
  },
]

export const COIN_MAP = new Map(COIN_DEFINITIONS.map((c) => [c.id, c]))

// Duración de vida máxima de una moneda en pantalla (ms)
export const COIN_LIFETIME_MS = 6000
