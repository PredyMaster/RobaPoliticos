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
  loot: weapon.loot,
  force: 220 + weapon.attack * 9,
  cooldown: Number(
    clamp(0.68 - weapon.attack / 280 - weapon.loot / 500, 0.3, 0.68).toFixed(2),
  ),
  criticalChance: Number(
    clamp(0.05 + weapon.attack / 420 + weapon.loot / 900, 0.05, 0.24).toFixed(2),
  ),
  criticalMultiplier: Number((1.35 + weapon.attack / 120 + weapon.loot / 500).toFixed(2)),
  spread: Number(clamp(0.74 - weapon.loot / 180, 0.14, 0.5).toFixed(2)),
  rarityBonus: Number(
    clamp((weapon.attack + weapon.loot - 20) / 160, 0, 0.45).toFixed(2),
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
