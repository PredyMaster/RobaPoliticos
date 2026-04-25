import { create } from 'zustand'
import type { Profile, AuthSession, PlayerPreferences } from '../game/types/player'
import type { Wallet } from '../game/types/economy'
import { getProfile } from '../services/supabase/profile'
import { getWallet } from '../services/supabase/wallet'
import { getSession, signOut } from '../services/supabase/auth'
import { DEFAULT_PREFERENCES } from '../game/types/player'

type PlayerState = {
  // Auth
  session: AuthSession | null
  isLoadingSession: boolean

  // Perfil y wallet (null = no cargado aún)
  profile: Profile | null
  wallet: Wallet | null

  // Preferencias persistidas localmente
  preferences: PlayerPreferences

  // Flags
  isLoadingPlayer: boolean
  loadError: string | null
}

type PlayerActions = {
  // Carga sesión activa y luego perfil + wallet
  loadPlayer: () => Promise<void>

  // Refresca solo la wallet (tras compras, partidas, etc.)
  refreshWallet: () => Promise<void>

  // Actualiza el perfil en el store sin ir a BD
  setProfile: (profile: Profile) => void

  // Actualiza preferencias y las persiste en localStorage
  setPreferences: (partial: Partial<PlayerPreferences>) => void

  // Limpia todo el estado (logout)
  logout: () => Promise<void>
}

const PREFS_KEY = 'rp_preferences'

function loadPrefsFromStorage(): PlayerPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<PlayerPreferences>) }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

function savePrefsToStorage(prefs: PlayerPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // localStorage puede no estar disponible (modo privado, Capacitor nativo)
  }
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  session: null,
  isLoadingSession: true,
  profile: null,
  wallet: null,
  preferences: loadPrefsFromStorage(),
  isLoadingPlayer: false,
  loadError: null,

  loadPlayer: async () => {
    set({ isLoadingPlayer: true, loadError: null })

    const session = await getSession()
    if (!session) {
      set({ session: null, isLoadingSession: false, isLoadingPlayer: false })
      return
    }

    const authSession: AuthSession = {
      userId: session.user.id,
      email: session.user.email ?? '',
      accessToken: session.access_token,
    }
    set({ session: authSession, isLoadingSession: false })

    const [profileResult, walletResult] = await Promise.all([
      getProfile(session.user.id),
      getWallet(session.user.id),
    ])

    if (profileResult.error || walletResult.error) {
      set({
        loadError: profileResult.error ?? walletResult.error,
        isLoadingPlayer: false,
      })
      return
    }

    set({
      profile: profileResult.data,
      wallet: walletResult.data,
      isLoadingPlayer: false,
    })
  },

  refreshWallet: async () => {
    const { session } = get()
    if (!session) return

    const { data, error } = await getWallet(session.userId)
    if (!error && data) set({ wallet: data })
  },

  setProfile: (profile) => set({ profile }),

  setPreferences: (partial) => {
    const next = { ...get().preferences, ...partial }
    savePrefsToStorage(next)
    set({ preferences: next })
  },

  logout: async () => {
    await signOut()
    set({
      session: null,
      profile: null,
      wallet: null,
      loadError: null,
    })
  },
}))
