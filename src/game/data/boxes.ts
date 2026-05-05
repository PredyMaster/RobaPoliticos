import type { BoxItem } from "../types/game"
import { SHOP_BOXES } from "./shopCatalog"

function magnetPowerForBox(id: string): number {
  if (id === "magnet_box") return 180
  if (id === "ultimate_box") return 260
  return 0
}

function textureForBox(id: string): string {
  return `catch_box_${id}`
}

function speedForBox(speed: number): number {
  return Math.round(220 * speed)
}

function accelerationForBox(speed: number): number {
  return Math.max(0, Math.round((speed - 1) * 120))
}

function widthForBox(size: number): number {
  return Math.round(380 * size)
}

function colliderWidthForBox(collider: number): number {
  return Math.round(380 * collider)
}

function heightForBox(): number {
  return 230
}

function multiplierForBox(bonus: number): number {
  return Number(bonus.toFixed(2))
}

function createBox(box: (typeof SHOP_BOXES)[number]): BoxItem {
  return {
    id: box.id,
    name: box.name,
    description: box.description,
    price: box.price,
    unlockLevel: box.unlockLevel,
    width: widthForBox(box.size),
    collider: colliderWidthForBox(box.collider),
    height: heightForBox(),
    speed: speedForBox(box.speed),
    acceleration: accelerationForBox(box.speed),
    magnetPower: magnetPowerForBox(box.id),
    multiplier: multiplierForBox(box.bonus),
    visualAsset: textureForBox(box.id),
  }
}

export const BOXES: BoxItem[] = SHOP_BOXES.map(createBox)

export const BOXES_MAP = new Map<string, BoxItem>(BOXES.map((b) => [b.id, b]))

const BOX_ALIASES: Record<string, string> = {
  small_box: "basic_box",
  fast_box: "stone_box",
  golden_box: "bonus_box",
  premium_box: "ultimate_box",
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
