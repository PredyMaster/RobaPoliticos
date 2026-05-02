import { supabase } from './client'
import type { RunResult } from '../../game/types/game'
import type { SubmitRunResult } from '../../game/types/player'

export async function submitRun(run: RunResult): Promise<SubmitRunResult> {
  const { data, error } = await (supabase as any).rpc('submit_run', {
    p_score_gained:       run.scoreGained,
    p_coins_collected:    run.coinsCollected,
    p_coins_lost:         run.coinsLost,
    p_hits:               run.hits,
    p_critical_hits:      run.criticalHits,
    p_max_combo:          run.maxCombo,
    p_duration_seconds:   run.durationSeconds,
    p_equipped_weapon_id: run.equippedWeaponId,
    p_equipped_box_id:    run.equippedBoxId,
  })

  if (error) return { ok: false, error: 'not_authenticated' }

  const result = data as {
    ok: boolean
    error?: string
    run_saved?: boolean
    new_total_score?: number
    new_coins?: number
    new_level?: number
  }

  if (!result.ok) {
    return {
      ok: false,
      error: (result.error ?? 'not_authenticated') as SubmitRunResult extends { ok: false } ? typeof result.error : never,
      runSaved: result.run_saved,
    } as SubmitRunResult
  }

  return {
    ok: true,
    newTotalScore: result.new_total_score ?? 0,
    newCoins:      result.new_coins      ?? 0,
    newLevel:      result.new_level      ?? 1,
  }
}

// Historial de partidas del jugador (últimas N)
export async function getRunHistory(
  userId: string,
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
  const { data, error } = await (supabase as any)
    .from('runs')
    .select('id, score_gained, coins_collected, max_combo, hits, duration_seconds, created_at')
    .eq('user_id', userId)
    .eq('suspicious', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }

  const rows = (data ?? []) as Array<{
    id: string
    score_gained: number
    coins_collected: number
    max_combo: number
    hits: number
    duration_seconds: number
    created_at: string
  }>

  return {
    data: rows.map((row) => ({
      id:               row.id,
      scoreGained:      row.score_gained,
      coinsCollected:   row.coins_collected,
      maxCombo:         row.max_combo,
      hits:             row.hits,
      durationSeconds:  row.duration_seconds,
      createdAt:        row.created_at,
    })),
    error: null,
  }
}
