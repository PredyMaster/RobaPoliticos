import type { RunResult } from '../../game/types/game'
import type { InventoryItem, MissionType, PlayerEquipment, Wallet } from '../../game/types/economy'
import type { AuthSession, Profile } from '../../game/types/player'
import { MISSIONS_MAP } from '../../game/data/missions'
import { SHOP_BOXES, SHOP_HANDS, SHOP_WEAPONS } from '../../game/data/shopCatalog'
import { resolveBoxId } from '../../game/data/boxes'
import { resolveHandId } from '../../game/data/hands'
import { resolveWeaponId } from '../../game/data/weapons'
import { calculateLevel } from '../../game/utils/math'

const STORAGE_KEY = 'rp_local_game_data'

export const LOCAL_USER_ID = 'local-player'

export const LOCAL_SESSION: AuthSession = {
  userId: LOCAL_USER_ID,
  email: 'local@roba-politicos.dev',
  accessToken: 'local-session',
}

export type StoredRun = RunResult & {
  id: string
  createdAt: string
}

type MissionClaim = {
  missionId: string
  dateKey: string | null
  claimedAt: string
}

export type LocalGameData = {
  profile: Profile
  wallet: Wallet
  inventory: InventoryItem[]
  equipment: PlayerEquipment
  runs: StoredRun[]
  missionClaims: MissionClaim[]
}

function nowIso(): string {
  return new Date().toISOString()
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createInventoryItem(itemType: InventoryItem['itemType'], itemId: string): InventoryItem {
  return {
    id: createId(itemType),
    userId: LOCAL_USER_ID,
    itemType,
    itemId,
    purchasedAt: nowIso(),
  }
}

function getDefaultLoadout(createdAt = nowIso()): {
  inventory: InventoryItem[]
  equipment: PlayerEquipment
} {
  const defaultWeaponId = resolveWeaponId(SHOP_WEAPONS[0].id)
  const defaultHandId = resolveHandId(SHOP_HANDS[0].id)
  const defaultBoxId = resolveBoxId(SHOP_BOXES[0].id)

  return {
    inventory: [
      createInventoryItem('weapon', defaultWeaponId),
      createInventoryItem('hand', defaultHandId),
      createInventoryItem('box', defaultBoxId),
    ],
    equipment: {
      userId: LOCAL_USER_ID,
      equippedWeaponId: defaultWeaponId,
      equippedHandId: defaultHandId,
      equippedBoxId: defaultBoxId,
      updatedAt: createdAt,
    },
  }
}

function createInitialData(): LocalGameData {
  const createdAt = nowIso()
  const { inventory, equipment } = getDefaultLoadout(createdAt)

  return {
    profile: {
      id: LOCAL_USER_ID,
      username: 'Jugador local',
      avatarUrl: null,
      level: 1,
      createdAt,
      updatedAt: createdAt,
    },
    wallet: {
      userId: LOCAL_USER_ID,
      totalScore: 0,
      currentCoins: 0,
      premiumGems: 0,
      updatedAt: createdAt,
    },
    inventory,
    equipment,
    runs: [],
    missionClaims: [],
  }
}

function isMissionTypeForDateKey(missionType: MissionType): boolean {
  return missionType === 'daily' || missionType === 'weekly'
}

function sanitizeData(raw: Partial<LocalGameData> | null | undefined): LocalGameData {
  const fallback = createInitialData()
  if (!raw) return fallback

  const totalScore = Math.max(0, Number(raw.wallet?.totalScore ?? fallback.wallet.totalScore))
  const currentCoins = Math.max(0, Number(raw.wallet?.currentCoins ?? fallback.wallet.currentCoins))
  const premiumGems = Math.max(0, Number(raw.wallet?.premiumGems ?? fallback.wallet.premiumGems))
  const level = calculateLevel(totalScore)

  const inventory = Array.isArray(raw.inventory)
    ? raw.inventory
        .filter((item): item is InventoryItem =>
          Boolean(item?.itemType) &&
          Boolean(item?.itemId) &&
          (item.itemType === 'weapon' || item.itemType === 'hand' || item.itemType === 'box'),
        )
        .map((item) => ({
          id: item.id || createId(item.itemType),
          userId: LOCAL_USER_ID,
          itemType: item.itemType,
          itemId:
            item.itemType === 'weapon'
              ? resolveWeaponId(item.itemId)
              : item.itemType === 'hand'
                ? resolveHandId(item.itemId)
                : resolveBoxId(item.itemId),
          purchasedAt: item.purchasedAt || fallback.profile.createdAt,
        }))
    : fallback.inventory

  const ensureOwned = (itemType: InventoryItem['itemType'], itemId: string) => {
    if (inventory.some((item) => item.itemType === itemType && item.itemId === itemId)) return
    inventory.push(createInventoryItem(itemType, itemId))
  }

  const equippedWeaponId = resolveWeaponId(raw.equipment?.equippedWeaponId ?? fallback.equipment.equippedWeaponId)
  const equippedHandId = resolveHandId(raw.equipment?.equippedHandId ?? fallback.equipment.equippedHandId ?? SHOP_HANDS[0].id)
  const equippedBoxId = resolveBoxId(raw.equipment?.equippedBoxId ?? fallback.equipment.equippedBoxId)

  ensureOwned('weapon', equippedWeaponId)
  ensureOwned('hand', equippedHandId)
  ensureOwned('box', equippedBoxId)

  const runs = Array.isArray(raw.runs)
    ? raw.runs
        .filter((run): run is StoredRun =>
          Boolean(run?.id) &&
          typeof run?.scoreGained === 'number' &&
          typeof run?.coinsCollected === 'number' &&
          typeof run?.createdAt === 'string',
        )
        .map((run) => ({
          ...run,
          equippedWeaponId: resolveWeaponId(run.equippedWeaponId),
          equippedHandId: resolveHandId(run.equippedHandId ?? fallback.equipment.equippedHandId),
          equippedBoxId: resolveBoxId(run.equippedBoxId),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  const missionClaims = Array.isArray(raw.missionClaims)
    ? raw.missionClaims.filter((claim): claim is MissionClaim => {
        if (!claim?.missionId || typeof claim.claimedAt !== 'string') return false
        const mission = MISSIONS_MAP.get(claim.missionId)
        if (!mission) return false
        if (!isMissionTypeForDateKey(mission.missionType)) return claim.dateKey === null
        return typeof claim.dateKey === 'string' && claim.dateKey.length > 0
      })
    : []

  const createdAt = raw.profile?.createdAt ?? fallback.profile.createdAt
  const updatedAt = raw.profile?.updatedAt ?? raw.wallet?.updatedAt ?? fallback.profile.updatedAt

  return {
    profile: {
      id: LOCAL_USER_ID,
      username: raw.profile?.username?.trim() || fallback.profile.username,
      avatarUrl: raw.profile?.avatarUrl ?? null,
      level,
      createdAt,
      updatedAt,
    },
    wallet: {
      userId: LOCAL_USER_ID,
      totalScore,
      currentCoins,
      premiumGems,
      updatedAt: raw.wallet?.updatedAt ?? updatedAt,
    },
    inventory,
    equipment: {
      userId: LOCAL_USER_ID,
      equippedWeaponId,
      equippedHandId,
      equippedBoxId,
      updatedAt: raw.equipment?.updatedAt ?? updatedAt,
    },
    runs,
    missionClaims,
  }
}

export function getLocalData(): LocalGameData {
  if (typeof localStorage === 'undefined') return createInitialData()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = createInitialData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }

    const parsed = JSON.parse(raw) as Partial<LocalGameData>
    const sanitized = sanitizeData(parsed)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
    return sanitized
  } catch {
    const reset = createInitialData()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset))
    } catch {
      // Ignora errores de persistencia y permite seguir jugando.
    }
    return reset
  }
}

export function saveLocalData(data: LocalGameData): LocalGameData {
  const sanitized = sanitizeData(data)
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
    } catch {
      // Ignora errores de persistencia y mantiene el estado en memoria.
    }
  }
  return sanitized
}

export function updateLocalData(
  updater: (current: LocalGameData) => LocalGameData,
): LocalGameData {
  const current = getLocalData()
  const updated = updater(current)
  return saveLocalData(updated)
}

export function resetLocalData(): LocalGameData {
  const initial = createInitialData()
  return saveLocalData(initial)
}

export function resetRunLocalData(): LocalGameData {
  const current = getLocalData()
  const updatedAt = nowIso()
  const { inventory, equipment } = getDefaultLoadout(updatedAt)

  return saveLocalData({
    ...current,
    wallet: {
      ...current.wallet,
      currentCoins: 0,
      updatedAt,
    },
    inventory,
    equipment,
  })
}

export function getTodayKey(date = new Date()): string {
  return date.toISOString().split('T')[0]
}

export function getWeekKey(date = new Date()): string {
  const monday = new Date(date)
  const day = monday.getDay()
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export function isDateInToday(isoDate: string, todayKey = getTodayKey()): boolean {
  return isoDate.startsWith(todayKey)
}

export function isDateInWeek(isoDate: string, weekKey = getWeekKey()): boolean {
  const runDate = new Date(isoDate)
  return getWeekKey(runDate) === weekKey
}

export function getScoreForRanking(data: LocalGameData, ranking: 'global' | 'weekly' | 'daily' | 'max_combo'): number {
  if (ranking === 'global') return data.wallet.totalScore
  if (ranking === 'max_combo') return data.runs.reduce((best, run) => Math.max(best, run.maxCombo), 0)
  if (ranking === 'daily') {
    const todayKey = getTodayKey()
    return data.runs
      .filter((run) => isDateInToday(run.createdAt, todayKey))
      .reduce((sum, run) => sum + run.scoreGained, 0)
  }

  const weekKey = getWeekKey()
  return data.runs
    .filter((run) => isDateInWeek(run.createdAt, weekKey))
    .reduce((sum, run) => sum + run.scoreGained, 0)
}

export function hasOwnedItem(
  data: LocalGameData,
  itemType: InventoryItem['itemType'],
  itemId: string,
): boolean {
  const normalizedId =
    itemType === 'weapon'
      ? resolveWeaponId(itemId)
      : itemType === 'hand'
        ? resolveHandId(itemId)
        : resolveBoxId(itemId)

  return data.inventory.some((item) => item.itemType === itemType && item.itemId === normalizedId)
}
