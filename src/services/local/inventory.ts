import type {
  EquipResult,
  InventoryItem,
  PlayerEquipment,
  PurchaseResult,
  ShopItemType,
} from '../../game/types/economy'
import { SHOP_BOXES, SHOP_HANDS, SHOP_WEAPONS } from '../../game/data/shopCatalog'
import { resolveBoxId } from '../../game/data/boxes'
import { resolveHandId } from '../../game/data/hands'
import { resolveWeaponId } from '../../game/data/weapons'
import { getLocalData, hasOwnedItem, saveLocalData } from './storage'

function nowIso(): string {
  return new Date().toISOString()
}

function createInventoryId(itemType: ShopItemType): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${itemType}-${crypto.randomUUID()}`
  }

  return `${itemType}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeItemId(itemType: ShopItemType, itemId: string): string {
  if (itemType === 'weapon') return resolveWeaponId(itemId)
  if (itemType === 'hand') return resolveHandId(itemId)
  return resolveBoxId(itemId)
}

function getCatalogEntry(itemType: ShopItemType, itemId: string) {
  const normalizedId = normalizeItemId(itemType, itemId)

  if (itemType === 'weapon') {
    return SHOP_WEAPONS.find((item) => item.id === normalizedId) ?? null
  }
  if (itemType === 'hand') {
    return SHOP_HANDS.find((item) => item.id === normalizedId) ?? null
  }

  return SHOP_BOXES.find((item) => item.id === normalizedId) ?? null
}

export async function getInventory(
  _userId: string,
): Promise<{ data: InventoryItem[]; error: string | null }> {
  return { data: getLocalData().inventory, error: null }
}

export async function getEquipment(
  _userId: string,
): Promise<{ data: PlayerEquipment | null; error: string | null }> {
  return { data: getLocalData().equipment, error: null }
}

export async function purchaseItem(
  itemType: ShopItemType,
  itemId: string,
): Promise<PurchaseResult> {
  const current = getLocalData()
  const normalizedId = normalizeItemId(itemType, itemId)
  const catalogEntry = getCatalogEntry(itemType, normalizedId)

  if (!catalogEntry) return { ok: false, error: 'item_not_found' }
  if (hasOwnedItem(current, itemType, normalizedId)) return { ok: false, error: 'already_owned' }
  if (current.profile.level < catalogEntry.unlockLevel) {
    return { ok: false, error: 'level_too_low', requiredLevel: catalogEntry.unlockLevel }
  }
  if (current.wallet.currentCoins < catalogEntry.price) {
    return {
      ok: false,
      error: 'insufficient_coins',
      needed: catalogEntry.price,
      have: current.wallet.currentCoins,
    }
  }

  const purchasedAt = nowIso()
  saveLocalData({
    ...current,
    wallet: {
      ...current.wallet,
      currentCoins: current.wallet.currentCoins - catalogEntry.price,
      updatedAt: purchasedAt,
    },
    inventory: [
      ...current.inventory,
      {
        id: createInventoryId(itemType),
        userId: current.wallet.userId,
        itemType,
        itemId: normalizedId,
        purchasedAt,
      },
    ],
  })

  return { ok: true, itemType, itemId: normalizedId }
}

export async function equipItem(
  itemType: ShopItemType,
  itemId: string,
): Promise<EquipResult> {
  const current = getLocalData()
  const normalizedId = normalizeItemId(itemType, itemId)

  if (!hasOwnedItem(current, itemType, normalizedId)) return { ok: false, error: 'not_owned' }

  const updatedAt = nowIso()
  saveLocalData({
    ...current,
    equipment: {
      ...current.equipment,
      ...(itemType === 'weapon'
        ? { equippedWeaponId: normalizedId }
        : itemType === 'hand'
          ? { equippedHandId: normalizedId }
          : { equippedBoxId: normalizedId }),
      updatedAt,
    },
  })

  return { ok: true, itemType, itemId: normalizedId }
}
