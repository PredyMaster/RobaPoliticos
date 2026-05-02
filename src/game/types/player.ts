// Tipos de perfil y estado del jugador

export type Profile = {
  id: string
  username: string
  avatarUrl: string | null
  level: number
  createdAt: string
  updatedAt: string
}

export type PlayerStats = {
  totalHits: number
  totalCoinsCollected: number
  bestCombo: number
  bestRunScore: number
  gamesPlayed: number
  totalTimePlayed: number   // segundos
}

// Perfil completo con wallet y stats agregados
export type PlayerFull = Profile & {
  totalScore: number
  currentCoins: number
  premiumGems: number
  stats: PlayerStats
}

// ── Ranking ──────────────────────────────────────────────────

export type RankingType = 'global' | 'weekly' | 'daily' | 'max_combo'

export type LeaderboardEntry = {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  score: number
  level: number
  isCurrentPlayer: boolean
}

// ── Submit run ───────────────────────────────────────────────

export type SubmitRunResult =
  | { ok: true; newTotalScore: number; newCoins: number; newLevel: number }
  | { ok: false; error: SubmitRunError; runSaved?: boolean }

export type SubmitRunError =
  | 'invalid_values'
  | 'weapon_not_owned'
  | 'hand_not_owned'
  | 'box_not_owned'
  | 'suspicious_run'

// ── Jugador local ────────────────────────────────────────────

export type AuthSession = {
  userId: string
  email: string
  accessToken: string
}

// ── Config de jugador (preferencias) ────────────────────────

export type PlayerPreferences = {
  musicEnabled: boolean
  sfxEnabled: boolean
  vibrationEnabled: boolean
  language: string
  graphicsQuality: import('./game').GraphicsQuality
}

export const DEFAULT_PREFERENCES: PlayerPreferences = {
  musicEnabled: true,
  sfxEnabled: true,
  vibrationEnabled: true,
  language: 'es',
  graphicsQuality: 'high',
}
