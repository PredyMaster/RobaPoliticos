import { supabase } from './client'
import type { Profile } from '../../game/types/player'

function rowToProfile(row: {
  id: string
  username: string
  avatar_url: string | null
  level: number
  created_at: string
  updated_at: string
}): Profile {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(
  userId: string,
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: rowToProfile(data), error: null }
}

export async function updateProfile(
  userId: string,
  updates: { username?: string; avatarUrl?: string | null },
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(updates.username !== undefined && { username: updates.username }),
      ...(updates.avatarUrl !== undefined && { avatar_url: updates.avatarUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: rowToProfile(data), error: null }
}
