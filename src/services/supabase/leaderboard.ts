import { supabase } from './client'
import type { LeaderboardEntry, RankingType } from '../../game/types/player'

// Número de entradas a traer por ranking
const PAGE_SIZE = 50

type LeaderboardRow = {
  user_id: string
  weekly_score?: number
  total_score?: number
  profiles: {
    username: string
    avatar_url: string | null
    level: number
  } | null
}

function rowToEntry(
  row: LeaderboardRow,
  rank: number,
  score: number,
  currentUserId: string | null,
): LeaderboardEntry {
  return {
    rank,
    userId: row.user_id,
    username: row.profiles?.username ?? 'Anónimo',
    avatarUrl: row.profiles?.avatar_url ?? null,
    score,
    level: row.profiles?.level ?? 1,
    isCurrentPlayer: row.user_id === currentUserId,
  }
}

export async function getGlobalLeaderboard(
  currentUserId: string | null = null,
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('wallets')
    .select('user_id, total_score, profiles(username, avatar_url, level)')
    .order('total_score', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) return { data: [], error: error.message }

  const entries = (data as LeaderboardRow[]).map((row, i) =>
    rowToEntry(row, i + 1, row.total_score ?? 0, currentUserId),
  )
  return { data: entries, error: null }
}

export async function getWeeklyLeaderboard(
  currentUserId: string | null = null,
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const weekStart = getMonday(new Date()).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('leaderboard_weekly')
    .select('user_id, weekly_score, profiles(username, avatar_url, level)')
    .eq('week_start', weekStart)
    .order('weekly_score', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) return { data: [], error: error.message }

  const entries = (data as LeaderboardRow[]).map((row, i) =>
    rowToEntry(row, i + 1, row.weekly_score ?? 0, currentUserId),
  )
  return { data: entries, error: null }
}

export async function getDailyLeaderboard(
  currentUserId: string | null = null,
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('runs')
    .select('user_id, score_gained, profiles(username, avatar_url, level)')
    .eq('suspicious', false)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .order('score_gained', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) return { data: [], error: error.message }

  // Agrupar por user_id sumando score_gained del día
  const scoreMap = new Map<string, { total: number; row: LeaderboardRow }>()
  for (const row of data as LeaderboardRow[]) {
    const prev = scoreMap.get(row.user_id)
    const gained = (row as LeaderboardRow & { score_gained?: number }).score_gained ?? 0
    if (prev) {
      prev.total += gained
    } else {
      scoreMap.set(row.user_id, { total: gained, row })
    }
  }

  const sorted = [...scoreMap.values()].sort((a, b) => b.total - a.total)
  const entries = sorted.map(({ total, row }, i) =>
    rowToEntry(row, i + 1, total, currentUserId),
  )
  return { data: entries, error: null }
}

export async function getMaxComboLeaderboard(
  currentUserId: string | null = null,
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('runs')
    .select('user_id, max_combo, profiles(username, avatar_url, level)')
    .eq('suspicious', false)
    .order('max_combo', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) return { data: [], error: error.message }

  // Una entrada por jugador (el mejor combo)
  const seen = new Set<string>()
  const entries: LeaderboardEntry[] = []
  let rank = 1
  for (const row of data as (LeaderboardRow & { max_combo?: number })[]) {
    if (seen.has(row.user_id)) continue
    seen.add(row.user_id)
    entries.push(rowToEntry(row, rank++, row.max_combo ?? 0, currentUserId))
  }
  return { data: entries, error: null }
}

export async function getLeaderboard(
  type: RankingType,
  currentUserId: string | null = null,
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  switch (type) {
    case 'global':    return getGlobalLeaderboard(currentUserId)
    case 'weekly':    return getWeeklyLeaderboard(currentUserId)
    case 'daily':     return getDailyLeaderboard(currentUserId)
    case 'max_combo': return getMaxComboLeaderboard(currentUserId)
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
