import type { CombatLoadout } from '../types/game'
import { getHand, HANDS } from './hands'
import { getWeapon, WEAPONS } from './weapons'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const HAND_INDEX = new Map(HANDS.map((hand, index) => [hand.id, index + 1]))
const WEAPON_INDEX = new Map(
  WEAPONS.map((weapon, index) => [weapon.id, index + 1]),
)

export function getCursorTextureKey(handId: string, weaponId: string): string {
  const hand = getHand(handId)
  const weapon = getWeapon(weaponId)
  const handIndex = HAND_INDEX.get(hand.id) ?? 1
  const weaponIndex = WEAPON_INDEX.get(weapon.id) ?? 1

  return `weapon_cursor_hand${handIndex}_weapon${weaponIndex}`
}

export function getCursorTexturePath(handId: string, weaponId: string): string {
  const hand = getHand(handId)
  const weapon = getWeapon(weaponId)
  const handIndex = HAND_INDEX.get(hand.id) ?? 1
  const weaponIndex = WEAPON_INDEX.get(weapon.id) ?? 1

  return `assets/hands_weapons/hand${handIndex}/hand${handIndex}_weapon${weaponIndex}.png`
}

export function listCombatCursorAssets(): Array<{ key: string; path: string }> {
  return HANDS.flatMap((hand) =>
    WEAPONS.map((weapon) => ({
      key: getCursorTextureKey(hand.id, weapon.id),
      path: getCursorTexturePath(hand.id, weapon.id),
    })),
  )
}

export function getCombatLoadout(
  weaponId: string,
  handId: string,
): CombatLoadout {
  const weapon = getWeapon(weaponId)
  const hand = getHand(handId)
  const weaponTier = WEAPON_INDEX.get(weapon.id) ?? 1
  const handTier = HAND_INDEX.get(hand.id) ?? 1
  const attack = weapon.attack + hand.attack
  const loot = Math.round((weapon.loot + hand.loot) / 2)
  const dropProgress = clamp((weaponTier + handTier - 2) / 10, 0, 1)
  const minDrops = 1 + Math.floor(dropProgress * 3.2)
  const maxDrops = Math.min(6, minDrops + 1 + Math.floor(dropProgress * 1.8))

  return {
    weapon,
    hand,
    attack,
    loot,
    force: 220 + attack * 7,
    cooldown: Number(
      clamp(0.66 - dropProgress * 0.16 - attack / 900, 0.28, 0.7).toFixed(2),
    ),
    criticalChance: Number(
      clamp(0.06 + dropProgress * 0.1 + attack / 1100, 0.06, 0.22).toFixed(2),
    ),
    criticalMultiplier: Number((1.35 + dropProgress * 0.35 + attack / 320).toFixed(2)),
    spread: Number(clamp(0.8 - loot / 160 - dropProgress * 0.16, 0.12, 0.44).toFixed(2)),
    rarityBonus: Number(
      clamp(0.08 + dropProgress * 0.28 + loot / 320, 0.08, 0.55).toFixed(2),
    ),
    dropProgress: Number(dropProgress.toFixed(2)),
    minDrops,
    maxDrops,
    soundEffect: weapon.soundEffect,
    cursorTextureKey: getCursorTextureKey(hand.id, weapon.id),
    cursorTexturePath: getCursorTexturePath(hand.id, weapon.id),
  }
}
