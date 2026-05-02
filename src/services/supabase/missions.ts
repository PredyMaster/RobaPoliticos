import { supabase } from './client'
import type { MissionProgress, MissionWithProgress, ClaimMissionResult } from '../../game/types/economy'
import { MISSIONS_CATALOG, MISSIONS_MAP } from '../../game/data/missions'

// ── Progreso de misiones del jugador ─────────────────────────

export async function getMissionsForUser(
  userId: string,
): Promise<{ data: MissionWithProgress[]; error: string | null }> {
  const today = new Date().toISOString().split('T')[0]
  const weekStart = getMonday(new Date()).toISOString().split('T')[0]

  const { data, error } = await (supabase as any)
    .from('mission_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) return { data: [], error: error.message }

  const rows = (data ?? []) as Array<{
    id: string
    user_id: string
    mission_id: string
    progress: number
    completed: boolean
    claimed: boolean
    date_key: string | null
    updated_at: string
  }>

  const progressMap = new Map<string, MissionProgress>()
  for (const row of rows) {
    const key = row.mission_id + '_' + (row.date_key ?? '')
    progressMap.set(key, {
      id: row.id,
      userId: row.user_id,
      missionId: row.mission_id,
      progress: row.progress,
      completed: row.completed,
      claimed: row.claimed,
      dateKey: row.date_key,
      updatedAt: row.updated_at,
    })
  }

  const missions: MissionWithProgress[] = MISSIONS_CATALOG.map((catalog) => {
    let dateKey: string | null = null
    if (catalog.missionType === 'daily') dateKey = today
    if (catalog.missionType === 'weekly') dateKey = weekStart

    const key = catalog.id + '_' + (dateKey ?? '')
    const progress = progressMap.get(key)

    return {
      ...catalog,
      progress: progress?.progress ?? 0,
      completed: progress?.completed ?? false,
      claimed: progress?.claimed ?? false,
    }
  })

  return { data: missions, error: null }
}

// ── Reclamar recompensa (RPC) ────────────────────────────────

export async function claimMissionReward(
  missionId: string,
): Promise<ClaimMissionResult> {
  const mission = MISSIONS_MAP.get(missionId)
  let dateKey: string | undefined

  if (mission?.missionType === 'daily') {
    dateKey = new Date().toISOString().split('T')[0]
  } else if (mission?.missionType === 'weekly') {
    dateKey = getMonday(new Date()).toISOString().split('T')[0]
  }

  const { data, error } = await (supabase as any).rpc('claim_mission_reward', {
    p_mission_id: missionId,
    ...(dateKey ? { p_date_key: dateKey } : {}),
  })

  if (error) return { ok: false, error: 'not_authenticated' }

  const result = data as { ok: boolean; error?: string; reward_coins?: number; reward_gems?: number }

  if (!result.ok) {
    return { ok: false, error: (result.error ?? 'mission_not_found') as ClaimMissionResult extends { ok: false } ? typeof result.error : never } as ClaimMissionResult
  }

  return {
    ok: true,
    rewardCoins: result.reward_coins ?? 0,
    rewardGems: result.reward_gems ?? 0,
  }
}

// ── Helper ───────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
