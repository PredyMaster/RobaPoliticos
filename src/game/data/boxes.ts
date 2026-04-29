import type { BoxItem } from '../types/game'

export const BOXES: BoxItem[] = [
  {
    id: 'small_box',
    name: 'Caja pequeña',
    description: 'La caja básica. Pequeña y difícil de acertar.',
    price: 0,
    unlockLevel: 1,
    width: 384,
    height: 240,
    speed: 220,
    acceleration: 0,
    magnetPower: 0,
    multiplier: 1.0,
    visualAsset: 'box_small',
  },
  {
    id: 'wide_box',
    name: 'Caja ancha',
    description: 'Más superficie para atrapar monedas. Mucho más fácil.',
    price: 300,
    unlockLevel: 1,
    width: 560,
    height: 240,
    speed: 220,
    acceleration: 0,
    magnetPower: 0,
    multiplier: 1.0,
    visualAsset: 'box_wide',
  },
  {
    id: 'fast_box',
    name: 'Caja rápida',
    description: 'Se mueve más deprisa. Mejor para monedas laterales.',
    price: 800,
    unlockLevel: 2,
    width: 440,
    height: 240,
    speed: 380,
    acceleration: 40,
    magnetPower: 0,
    multiplier: 1.0,
    visualAsset: 'box_fast',
  },
  {
    id: 'magnet_box',
    name: 'Caja imán',
    description: 'Atrae las monedas cercanas hacia ella.',
    price: 2000,
    unlockLevel: 4,
    width: 480,
    height: 260,
    speed: 260,
    acceleration: 0,
    magnetPower: 180,
    multiplier: 1.0,
    visualAsset: 'box_magnet',
  },
  {
    id: 'golden_box',
    name: 'Caja dorada',
    description: 'Multiplica el valor de cada moneda recogida.',
    price: 6000,
    unlockLevel: 6,
    width: 480,
    height: 260,
    speed: 260,
    acceleration: 0,
    magnetPower: 0,
    multiplier: 1.8,
    visualAsset: 'box_golden',
  },
  {
    id: 'premium_box',
    name: 'Caja premium',
    description: 'Grande, rápida y con un pequeño efecto de atracción.',
    price: 20000,
    unlockLevel: 9,
    width: 680,
    height: 280,
    speed: 340,
    acceleration: 30,
    magnetPower: 80,
    multiplier: 1.5,
    visualAsset: 'box_premium',
  },
]

export const BOXES_MAP = new Map<string, BoxItem>(
  BOXES.map((b) => [b.id, b]),
)

export function getBox(id: string): BoxItem {
  const b = BOXES_MAP.get(id)
  if (!b) throw new Error(`Box not found: ${id}`)
  return b
}
