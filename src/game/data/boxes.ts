import type { BoxItem } from '../types/game'
import { SHOP_BOXES } from './shopCatalog'

function magnetPowerForBox(id: string, bonus: number): number {
  if (id === 'magnet_box') return 180
  if (id === 'ultimate_box') return 120
  if (bonus > 1.2) return 80
  return 0
}

export const BOXES: BoxItem[] = SHOP_BOXES.map((box) => ({
  id: box.id,
  name: box.name,
  description: box.description,
  price: box.price,
  unlockLevel: box.unlockLevel,
  width: Math.round(380 * box.size),
  height: Math.round(230 * Math.min(box.size, 1.35)),
  speed: Math.round(220 * box.speed),
  acceleration: Math.max(0, Math.round((box.speed - 1) * 120)),
  magnetPower: magnetPowerForBox(box.id, box.bonus),
  multiplier: box.bonus,
  visualAsset: `shop_box_${box.id}`,
}))

export const BOXES_MAP = new Map<string, BoxItem>(
  BOXES.map((b) => [b.id, b]),
)

const BOX_ALIASES: Record<string, string> = {
  small_box: 'basic_box',
  fast_box: 'wheel_box',
  golden_box: 'bonus_box',
  premium_box: 'ultimate_box',
}

export function resolveBoxId(id: string): string {
  if (BOXES_MAP.has(id)) return id
  const alias = BOX_ALIASES[id]
  if (alias && BOXES_MAP.has(alias)) return alias
  return BOXES[0].id
}

export function getBox(id: string): BoxItem {
  return BOXES_MAP.get(resolveBoxId(id)) ?? BOXES[0]
}
