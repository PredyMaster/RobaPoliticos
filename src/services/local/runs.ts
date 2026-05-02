import type { RunResult } from '../../game/types/game'
import type { SubmitRunResult } from '../../game/types/player'
import { calculateLevel } from '../../game/utils/math'
import {
  getLocalData,
  hasOwnedItem,
  saveLocalData,
  type StoredRun,
} from './storage'

function isValidNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

function createRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function submitRun(run: RunResult): Promise<SubmitRunResult> {
  const numericValues = [
    run.scoreGained,
    run.coinsCollected,
    run.coinsLost,
    run.hits,
    run.criticalHits,
    run.maxCombo,
    run.durationSeconds,
  ]

  if (numericValues.some((value) => !isValidNumber(value))) {
    return { ok: false, error: 'invalid_values' }
  }

  const current = getLocalData()

  if (!hasOwnedItem(current, 'weapon', run.equippedWeaponId)) {
    return { ok: false, error: 'weapon_not_owned' }
  }

  if (!hasOwnedItem(current, 'hand', run.equippedHandId)) {
    return { ok: false, error: 'hand_not_owned' }
  }

  if (!hasOwnedItem(current, 'box', run.equippedBoxId)) {
    return { ok: false, error: 'box_not_owned' }
  }

  const createdAt = new Date().toISOString()
  const storedRun: StoredRun = {
    ...run,
    id: createRunId(),
    createdAt,
  }

  const newTotalScore = current.wallet.totalScore + run.scoreGained
  const newCoins = current.wallet.currentCoins
  const newLevel = calculateLevel(newTotalScore)

  saveLocalData({
    ...current,
    profile: {
      ...current.profile,
      level: newLevel,
      updatedAt: createdAt,
    },
    wallet: {
      ...current.wallet,
      totalScore: newTotalScore,
      updatedAt: createdAt,
    },
    runs: [storedRun, ...current.runs],
  })

  return {
    ok: true,
    newTotalScore,
    newCoins,
    newLevel,
  }
}

export async function getRunHistory(
  _userId: string,
  limit = 20,
): Promise<{
  data: {
    id: string
    scoreGained: number
    coinsCollected: number
    maxCombo: number
    hits: number
    durationSeconds: number
    createdAt: string
  }[]
  error: string | null
}> {
  const rows = getLocalData().runs
    .slice(0, limit)
    .map((run) => ({
      id: run.id,
      scoreGained: run.scoreGained,
      coinsCollected: run.coinsCollected,
      maxCombo: run.maxCombo,
      hits: run.hits,
      durationSeconds: run.durationSeconds,
      createdAt: run.createdAt,
    }))

  return { data: rows, error: null }
}
