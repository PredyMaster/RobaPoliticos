import { create } from "zustand"
import type {
  Profile,
  AuthSession,
  PlayerPreferences,
} from "../game/types/player"
import type { Wallet } from "../game/types/economy"
import { EventBus } from "../game/EventBus"
import { getProfile } from "../services/local/profile"
import { getWallet } from "../services/local/wallet"
import { DEFAULT_PREFERENCES } from "../game/types/player"
import {
  LOCAL_SESSION,
  resetLocalData,
  resetRunLocalData,
  updateLocalData,
} from "../services/local/storage"

type PlayerState = {
  // Jugador local
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
  // Carga progreso local y luego perfil + wallet
  loadPlayer: () => Promise<void>

  // Refresca solo la wallet (tras compras, partidas, etc.)
  refreshWallet: () => Promise<void>

  // Actualiza el perfil en el store sin ir a BD
  setProfile: (profile: Profile) => void

  // Suma monedas al saldo persistido y sincroniza la wallet del store
  addCoins: (amount: number) => void

  // Actualiza preferencias y las persiste en localStorage
  setPreferences: (partial: Partial<PlayerPreferences>) => void

  // Reinicia el progreso local
  resetProgress: () => Promise<void>

  // Reinicia solo monedas de tienda e inventario/equipo para una nueva partida
  resetRunState: () => Promise<void>
}

const PREFS_KEY = "rp_preferences"

function loadPrefsFromStorage(): PlayerPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    return {
      ...DEFAULT_PREFERENCES,
      ...(JSON.parse(raw) as Partial<PlayerPreferences>),
    }
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

function emitWalletUpdated(wallet: Wallet | null): void {
  if (!wallet) return
  EventBus.emit("WALLET_UPDATED", { currentCoins: wallet.currentCoins })
}

export const usePlayerStore = create<PlayerState & PlayerActions>(
  (set, get) => ({
    session: null,
    isLoadingSession: true,
    profile: null,
    wallet: null,
    preferences: loadPrefsFromStorage(),
    isLoadingPlayer: false,
    loadError: null,

    loadPlayer: async () => {
      set({ isLoadingPlayer: true, loadError: null })

      const authSession: AuthSession = { ...LOCAL_SESSION }
      set({ session: authSession, isLoadingSession: false })

      const [profileResult, walletResult] = await Promise.all([
        getProfile(authSession.userId),
        getWallet(authSession.userId),
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
      emitWalletUpdated(walletResult.data)
    },

    refreshWallet: async () => {
      const { session } = get()
      if (!session) return

      const { data, error } = await getWallet(session.userId)
      if (!error && data) {
        set({ wallet: data })
        emitWalletUpdated(data)
      }
    },

    setProfile: (profile) => set({ profile }),

    addCoins: (amount) => {
      if (!Number.isFinite(amount) || amount <= 0) return

      const updatedAt = new Date().toISOString()
      const next = updateLocalData((current) => ({
        ...current,
        wallet: {
          ...current.wallet,
          currentCoins: current.wallet.currentCoins + amount,
          updatedAt,
        },
      }))

      set({ wallet: next.wallet })
      emitWalletUpdated(next.wallet)
    },

    setPreferences: (partial) => {
      const next = { ...get().preferences, ...partial }
      savePrefsToStorage(next)
      set({ preferences: next })
    },

    resetProgress: async () => {
      const reset = resetLocalData()
      set({
        session: { ...LOCAL_SESSION },
        profile: reset.profile,
        wallet: reset.wallet,
        loadError: null,
        isLoadingSession: false,
        isLoadingPlayer: false,
      })
      emitWalletUpdated(reset.wallet)
    },

    resetRunState: async () => {
      const reset = resetRunLocalData()
      set({
        session: { ...LOCAL_SESSION },
        profile: reset.profile,
        wallet: reset.wallet,
        loadError: null,
        isLoadingSession: false,
        isLoadingPlayer: false,
      })
      emitWalletUpdated(reset.wallet)
    },
  }),
)
