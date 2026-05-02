// Tipos de economía: wallet, compras, inventario, equipamiento

export type ShopItemType = 'weapon' | 'hand' | 'box'

export type Wallet = {
  userId: string
  totalScore: number
  currentCoins: number
  premiumGems: number
  updatedAt: string
}

export type InventoryItem = {
  id: string
  userId: string
  itemType: ShopItemType
  itemId: string
  purchasedAt: string
}

export type PlayerEquipment = {
  userId: string
  equippedWeaponId: string
  equippedHandId?: string
  equippedBoxId: string
  updatedAt: string
}

// ── Compras ──────────────────────────────────────────────────

export type PurchaseRequest = {
  itemType: ShopItemType
  itemId: string
}

export type PurchaseResult =
  | { ok: true; itemType: ShopItemType; itemId: string }
  | { ok: false; error: PurchaseError; requiredLevel?: number; needed?: number; have?: number }

export type PurchaseError =
  | 'invalid_item_type'
  | 'item_not_found'
  | 'already_owned'
  | 'level_too_low'
  | 'insufficient_coins'

export type EquipResult =
  | { ok: true; itemType: ShopItemType; itemId: string }
  | { ok: false; error: EquipError }

export type EquipError =
  | 'invalid_item_type'
  | 'not_owned'

// ── Item combinado (catálogo + estado del jugador) ───────────

export type ShopItemStatus = 'locked' | 'available' | 'owned' | 'equipped'

export type ShopWeaponItem = {
  weapon: import('./game').Weapon
  status: ShopItemStatus
}

export type ShopHandItem = {
  hand: import('./game').HandItem
  status: ShopItemStatus
}

export type ShopBoxItem = {
  box: import('./game').BoxItem
  status: ShopItemStatus
}

// ── Misiones ─────────────────────────────────────────────────

export type MissionType = 'daily' | 'weekly' | 'achievement'

export type MissionCatalogEntry = {
  id: string
  name: string
  description: string
  missionType: MissionType
  goal: number
  rewardCoins: number
  rewardGems: number
}

export type MissionProgress = {
  id: string
  userId: string
  missionId: string
  progress: number
  completed: boolean
  claimed: boolean
  dateKey: string | null
  updatedAt: string
}

export type MissionWithProgress = MissionCatalogEntry & {
  progress: number
  completed: boolean
  claimed: boolean
}

export type ClaimMissionResult =
  | { ok: true; rewardCoins: number; rewardGems: number }
  | { ok: false; error: ClaimMissionError }

export type ClaimMissionError =
  | 'mission_not_found'
  | 'not_completed'
  | 'already_claimed'
  | 'catalog_entry_not_found'

// ── Fórmulas de progresión ───────────────────────────────────

export type LevelInfo = {
  level: number
  totalScore: number
  scoreForNextLevel: number
  progress: number   // 0–1 hacia el siguiente nivel
}
