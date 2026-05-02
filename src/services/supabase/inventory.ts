import { supabase } from './client'
import type {
  EquipResult,
  InventoryItem,
  PlayerEquipment,
  PurchaseResult,
  ShopItemType,
} from '../../game/types/economy'

// ── Inventario ───────────────────────────────────────────────

export async function getInventory(
  userId: string,
): Promise<{ data: InventoryItem[]; error: string | null }> {
  const { data, error } = await (supabase as any)
    .from('player_inventory')
    .select('*')
    .eq('user_id', userId)

  if (error) return { data: [], error: error.message }

  const rows = (data ?? []) as Array<{
    id: string
    user_id: string
    item_type: string
    item_id: string
    purchased_at: string
  }>

  const items: InventoryItem[] = rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    itemType: row.item_type as ShopItemType,
    itemId: row.item_id,
    purchasedAt: row.purchased_at,
  }))

  return { data: items, error: null }
}

// ── Equipamiento ─────────────────────────────────────────────

export async function getEquipment(
  userId: string,
): Promise<{ data: PlayerEquipment | null; error: string | null }> {
  const { data, error } = await (supabase as any)
    .from('player_equipment')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return { data: null, error: error.message }

  const rawEquipment = data as {
    user_id: string
    equipped_weapon_id?: string | null
    equipped_hand_id?: string | null
    equipped_box_id?: string | null
    updated_at: string
  }

  return {
    data: {
      userId: rawEquipment.user_id,
      equippedWeaponId: rawEquipment.equipped_weapon_id ?? 'tree_branch',
      equippedHandId: rawEquipment.equipped_hand_id ?? 'bare_hand',
      equippedBoxId: rawEquipment.equipped_box_id ?? 'basic_box',
      updatedAt: rawEquipment.updated_at,
    },
    error: null,
  }
}

// ── Comprar item (RPC) ───────────────────────────────────────

export async function purchaseItem(
  itemType: ShopItemType,
  itemId: string,
): Promise<PurchaseResult> {
  const { data, error } = await (supabase as any).rpc('purchase_item', {
    p_item_type: itemType,
    p_item_id: itemId,
  })

  if (error) return { ok: false, error: 'not_authenticated' }

  const result = data as {
    ok: boolean
    error?: string
    item_type?: string
    item_id?: string
    required_level?: number
    needed?: number
    have?: number
  }

  if (!result.ok) {
    return {
      ok: false,
      error: (result.error ?? 'item_not_found') as PurchaseResult extends { ok: false } ? typeof result.error : never,
      requiredLevel: result.required_level,
      needed: result.needed,
      have: result.have,
    } as PurchaseResult
  }

  return {
    ok: true,
    itemType: (result.item_type ?? itemType) as ShopItemType,
    itemId: result.item_id ?? itemId,
  }
}

// ── Equipar item (RPC) ───────────────────────────────────────

export async function equipItem(
  itemType: ShopItemType,
  itemId: string,
): Promise<EquipResult> {
  const { data, error } = await (supabase as any).rpc('equip_item', {
    p_item_type: itemType,
    p_item_id: itemId,
  })

  if (error) return { ok: false, error: 'not_authenticated' }

  const result = data as { ok: boolean; error?: string; item_type?: string; item_id?: string }

  if (!result.ok) {
    return { ok: false, error: (result.error ?? 'not_owned') as EquipResult extends { ok: false } ? typeof result.error : never } as EquipResult
  }

  return {
    ok: true,
    itemType: (result.item_type ?? itemType) as ShopItemType,
    itemId: result.item_id ?? itemId,
  }
}
