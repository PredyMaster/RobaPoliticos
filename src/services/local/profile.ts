import type { Profile } from '../../game/types/player'
import { getLocalData, saveLocalData } from './storage'

export async function getProfile(
  _userId: string,
): Promise<{ data: Profile | null; error: string | null }> {
  return { data: getLocalData().profile, error: null }
}

export async function updateProfile(
  _userId: string,
  updates: { username?: string; avatarUrl?: string | null },
): Promise<{ data: Profile | null; error: string | null }> {
  const current = getLocalData()
  const next: Profile = {
    ...current.profile,
    ...(updates.username !== undefined ? { username: updates.username.trim() || current.profile.username } : {}),
    ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
    updatedAt: new Date().toISOString(),
  }

  const saved = saveLocalData({
    ...current,
    profile: next,
  })

  return { data: saved.profile, error: null }
}
