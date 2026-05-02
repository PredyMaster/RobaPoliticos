import type { HandItem } from '../types/game'
import { SHOP_HANDS } from './shopCatalog'

export const HANDS: HandItem[] = SHOP_HANDS.map((hand) => ({
  id: hand.id,
  name: hand.name,
  description: hand.description,
  price: hand.price,
  unlockLevel: hand.unlockLevel,
  attack: hand.attack,
  precision: hand.precision,
}))

export const HANDS_MAP = new Map<string, HandItem>(HANDS.map((hand) => [hand.id, hand]))

export function resolveHandId(id: string): string {
  return HANDS_MAP.has(id) ? id : HANDS[0].id
}

export function getHand(id: string): HandItem {
  return HANDS_MAP.get(resolveHandId(id)) ?? HANDS[0]
}
