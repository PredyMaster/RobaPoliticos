import type { Weapon } from '../types/game'
import { SHOP_WEAPONS } from './shopCatalog'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function soundEffectForTier(tier: number): string {
  if (tier <= 2) return 'sfx_slap_1'
  if (tier <= 4) return 'sfx_slap_2'
  if (tier === 5) return 'sfx_slap_3'
  return 'sfx_slap_4'
}

export const WEAPONS: Weapon[] = SHOP_WEAPONS.map((weapon) => ({
  id: weapon.id,
  name: weapon.name,
  description: weapon.description,
  price: weapon.price,
  unlockLevel: weapon.unlockLevel,
  attack: weapon.attack,
  precision: weapon.precision,
  coinsPerHit: weapon.attack,
  force: 220 + weapon.attack * 9,
  cooldown: Number(
    clamp(0.62 - weapon.precision / 250 + weapon.attack / 420, 0.34, 0.72).toFixed(2),
  ),
  criticalChance: Number(clamp(weapon.precision / 400, 0.08, 0.24).toFixed(2)),
  criticalMultiplier: Number((1.7 + weapon.attack / 50).toFixed(2)),
  spread: Number(clamp(0.7 - weapon.precision / 140, 0.12, 0.45).toFixed(2)),
  rarityBonus: Number(
    clamp((weapon.attack + weapon.precision - 50) / 250, 0, 0.38).toFixed(2),
  ),
  visualAsset: `shop_weapon_${weapon.id}`,
  soundEffect: soundEffectForTier(weapon.tier),
}))

export const WEAPONS_MAP = new Map<string, Weapon>(
  WEAPONS.map((w) => [w.id, w]),
)

const WEAPON_ALIASES: Record<string, string> = {
  hand_basic: 'tree_branch',
  flip_flop: 'wrench',
  baseball_bat: 'bat',
  boxing_glove: 'pan',
  money_gun: 'pan',
  golden_mallet: 'golden_hammer',
  money_bazooka: 'golden_hammer',
}

export function resolveWeaponId(id: string): string {
  if (WEAPONS_MAP.has(id)) return id
  const alias = WEAPON_ALIASES[id]
  if (alias && WEAPONS_MAP.has(alias)) return alias
  return WEAPONS[0].id
}

export function getWeapon(id: string): Weapon {
  return WEAPONS_MAP.get(resolveWeaponId(id)) ?? WEAPONS[0]
}
