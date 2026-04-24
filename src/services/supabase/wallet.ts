import { supabase } from './client'
import type { Wallet } from '../../game/types/economy'

function rowToWallet(row: {
  user_id: string
  total_score: number
  current_coins: number
  premium_gems: number
  updated_at: string
}): Wallet {
  return {
    userId: row.user_id,
    totalScore: row.total_score,
    currentCoins: row.current_coins,
    premiumGems: row.premium_gems,
    updatedAt: row.updated_at,
  }
}

export async function getWallet(
  userId: string,
): Promise<{ data: Wallet | null; error: string | null }> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: rowToWallet(data), error: null }
}
