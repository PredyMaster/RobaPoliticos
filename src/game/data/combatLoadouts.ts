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
  const attack = weapon.attack + hand.attack
  const precision = Math.round((weapon.precision + hand.precision) / 2)

  return {
    weapon,
    hand,
    attack,
    precision,
    successChance: Number(clamp(precision / 100, 0.1, 0.95).toFixed(2)),
    force: 220 + attack * 7,
    cooldown: Number(
      clamp(0.66 - precision / 260 + attack / 700, 0.28, 0.72).toFixed(2),
    ),
    criticalChance: Number(
      clamp((precision - 35) / 300, 0.04, 0.22).toFixed(2),
    ),
    criticalMultiplier: Number((1.18 + attack / 210).toFixed(2)),
    spread: Number(clamp(0.82 - precision / 150, 0.1, 0.42).toFixed(2)),
    rarityBonus: Number(
      clamp((attack + precision - 70) / 260, 0, 0.45).toFixed(2),
    ),
    soundEffect: weapon.soundEffect,
    cursorTextureKey: getCursorTextureKey(hand.id, weapon.id),
    cursorTexturePath: getCursorTexturePath(hand.id, weapon.id),
  }
}
