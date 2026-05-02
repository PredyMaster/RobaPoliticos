import type { LeaderboardEntry, RankingType } from '../../game/types/player'
import { getLocalData, getScoreForRanking } from './storage'

const RIVAL_PROFILES = [
  { userId: 'npc-1', username: 'El Corruptazo', avatarUrl: null, level: 28, global: 58200, weekly: 11800, daily: 1800, max_combo: 42 },
  { userId: 'npc-2', username: 'Doña Sobres', avatarUrl: null, level: 24, global: 44100, weekly: 9500, daily: 2100, max_combo: 37 },
  { userId: 'npc-3', username: 'El Diputao', avatarUrl: null, level: 20, global: 32400, weekly: 7200, daily: 1300, max_combo: 31 },
  { userId: 'npc-4', username: 'Señor Maletín', avatarUrl: null, level: 17, global: 24700, weekly: 5800, daily: 980, max_combo: 26 },
  { userId: 'npc-5', username: 'La Consejera', avatarUrl: null, level: 13, global: 16800, weekly: 3200, daily: 760, max_combo: 22 },
]

type RivalProfile = (typeof RIVAL_PROFILES)[number]

function toEntry(
  player: {
    userId: string
    username: string
    avatarUrl: string | null
    level: number
  },
  rank: number,
  score: number,
  currentUserId: string | null,
): LeaderboardEntry {
  return {
    rank,
    userId: player.userId,
    username: player.username,
    avatarUrl: player.avatarUrl,
    score,
    level: player.level,
    isCurrentPlayer: player.userId === currentUserId,
  }
}

function getRivalScore(rival: RivalProfile, ranking: RankingType): number {
  if (ranking === 'global') return rival.global
  if (ranking === 'weekly') return rival.weekly
  if (ranking === 'daily') return rival.daily
  return rival.max_combo
}

export async function getLeaderboard(
  type: RankingType,
  currentUserId: string | null = null,
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const data = getLocalData()
  const myScore = getScoreForRanking(data, type)

  const entries = [
    ...RIVAL_PROFILES.map((rival) => ({
      userId: rival.userId,
      username: rival.username,
      avatarUrl: rival.avatarUrl,
      level: rival.level,
      score: getRivalScore(rival, type),
    })),
    {
      userId: data.profile.id,
      username: data.profile.username,
      avatarUrl: data.profile.avatarUrl,
      level: data.profile.level,
      score: myScore,
    },
  ]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => toEntry(entry, index + 1, entry.score, currentUserId))

  return { data: entries, error: null }
}
