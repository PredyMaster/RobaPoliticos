import type { ClaimMissionResult, MissionWithProgress } from '../../game/types/economy'
import { MISSIONS_CATALOG, MISSIONS_MAP } from '../../game/data/missions'
import {
  getLocalData,
  getTodayKey,
  getWeekKey,
  isDateInToday,
  isDateInWeek,
  saveLocalData,
} from './storage'

function isDefaultItem(itemType: string, itemId: string): boolean {
  return (
    (itemType === 'weapon' && itemId === 'tree_branch') ||
    (itemType === 'hand' && itemId === 'bare_hand') ||
    (itemType === 'box' && itemId === 'basic_box')
  )
}

function getMissionScopeKey(missionId: string): string | null {
  const mission = MISSIONS_MAP.get(missionId)
  if (!mission) return null
  if (mission.missionType === 'daily') return getTodayKey()
  if (mission.missionType === 'weekly') return getWeekKey()
  return null
}

function getMissionProgress(
  data: ReturnType<typeof getLocalData>,
  missionId: string,
): number {
  const mission = MISSIONS_MAP.get(missionId)
  if (!mission) return 0

  const todayKey = getTodayKey()
  const weekKey = getWeekKey()
  const dailyRuns = data.runs.filter((run) => isDateInToday(run.createdAt, todayKey))
  const weeklyRuns = data.runs.filter((run) => isDateInWeek(run.createdAt, weekKey))
  const allRuns = data.runs

  switch (missionId) {
    case 'daily_coins':
      return dailyRuns.reduce((sum, run) => sum + run.coinsCollected, 0)
    case 'daily_hits':
      return dailyRuns.reduce((sum, run) => sum + run.hits, 0)
    case 'daily_combos':
      return dailyRuns.reduce((best, run) => Math.max(best, run.maxCombo), 0)
    case 'daily_games':
      return dailyRuns.length
    case 'daily_crits':
      return dailyRuns.reduce((sum, run) => sum + run.criticalHits, 0)
    case 'daily_gold_coins':
      return dailyRuns.reduce((sum, run) => sum + Math.floor(run.coinsCollected / 25), 0)
    case 'weekly_coins':
      return weeklyRuns.reduce((sum, run) => sum + run.coinsCollected, 0)
    case 'weekly_hits':
      return weeklyRuns.reduce((sum, run) => sum + run.hits, 0)
    case 'weekly_games':
      return weeklyRuns.length
    case 'weekly_combo_20':
      return weeklyRuns.reduce((best, run) => Math.max(best, run.maxCombo), 0)
    case 'weekly_purchase':
      return data.inventory.filter((item) => !isDefaultItem(item.itemType, item.itemId))
        .filter((item) => isDateInWeek(item.purchasedAt, weekKey)).length
    case 'ach_100_games':
      return allRuns.length
    case 'ach_50k_coins':
      return allRuns.reduce((sum, run) => sum + run.coinsCollected, 0)
    case 'ach_combo_50':
      return allRuns.reduce((best, run) => Math.max(best, run.maxCombo), 0)
    case 'ach_all_weapons':
      return new Set(data.inventory.filter((item) => item.itemType === 'weapon').map((item) => item.itemId)).size
    case 'ach_all_boxes':
      return new Set(data.inventory.filter((item) => item.itemType === 'box').map((item) => item.itemId)).size
    default:
      return 0
  }
}

export async function getMissionsForUser(
  _userId: string,
): Promise<{ data: MissionWithProgress[]; error: string | null }> {
  const data = getLocalData()

  const missions = MISSIONS_CATALOG.map((mission) => {
    const progress = getMissionProgress(data, mission.id)
    const completed = progress >= mission.goal
    const scopeKey = getMissionScopeKey(mission.id)
    const claimed = data.missionClaims.some(
      (claim) => claim.missionId === mission.id && claim.dateKey === scopeKey,
    )

    return {
      ...mission,
      progress: Math.min(progress, mission.goal),
      completed,
      claimed,
    }
  })

  return { data: missions, error: null }
}

export async function claimMissionReward(
  missionId: string,
): Promise<ClaimMissionResult> {
  const mission = MISSIONS_MAP.get(missionId)
  if (!mission) return { ok: false, error: 'mission_not_found' }

  const current = getLocalData()
  const progress = getMissionProgress(current, missionId)
  if (progress < mission.goal) return { ok: false, error: 'not_completed' }

  const scopeKey = getMissionScopeKey(missionId)
  const alreadyClaimed = current.missionClaims.some(
    (claim) => claim.missionId === missionId && claim.dateKey === scopeKey,
  )
  if (alreadyClaimed) return { ok: false, error: 'already_claimed' }

  const claimedAt = new Date().toISOString()
  saveLocalData({
    ...current,
    wallet: {
      ...current.wallet,
      currentCoins: current.wallet.currentCoins + mission.rewardCoins,
      premiumGems: current.wallet.premiumGems + mission.rewardGems,
      updatedAt: claimedAt,
    },
    missionClaims: [
      ...current.missionClaims,
      {
        missionId,
        dateKey: scopeKey,
        claimedAt,
      },
    ],
  })

  return {
    ok: true,
    rewardCoins: mission.rewardCoins,
    rewardGems: mission.rewardGems,
  }
}
