import type { Wallet } from '../../game/types/economy'
import { getLocalData } from './storage'

export async function getWallet(
  _userId: string,
): Promise<{ data: Wallet | null; error: string | null }> {
  return { data: getLocalData().wallet, error: null }
}
