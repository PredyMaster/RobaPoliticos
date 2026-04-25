import { create } from 'zustand'
import type { GraphicsQuality, RunResult } from '../game/types/game'
import type { SubmitRunResult } from '../game/types/player'
import { submitRun } from '../services/supabase/runs'
import { usePlayerStore } from './usePlayerStore'

type GameState = {
  // Estado de la partida en curso
  isPaused: boolean
  isRunActive: boolean

  // Puntuación acumulada durante la partida (local, no va a BD por cada moneda)
  runScore: number
  runCoins: number

  // Resultado de la última partida (para pantalla End Run)
  lastRunResult: RunResult | null
  lastSubmitResult: SubmitRunResult | null
  isSubmitting: boolean

  // Audio y efectos (sincronizados con PlayerPreferences pero accesibles rápido desde Phaser)
  musicEnabled: boolean
  sfxEnabled: boolean
  vibrationEnabled: boolean

  // Calidad gráfica
  quality: GraphicsQuality
}

type GameActions = {
  // Control de partida
  startRun: () => void
  pauseRun: () => void
  resumeRun: () => void

  // Actualización de score durante gameplay (llamado desde Phaser vía EventBus)
  updateRunScore: (score: number, coins: number) => void

  // Finalizar partida: guarda localmente y envía a Supabase
  endRun: (result: RunResult) => Promise<void>

  // Preferencias rápidas (se sincronizan con usePlayerStore.setPreferences)
  setMusicEnabled: (value: boolean) => void
  setSfxEnabled: (value: boolean) => void
  setVibrationEnabled: (value: boolean) => void
  setQuality: (value: GraphicsQuality) => void

  // Sincronizar desde PlayerStore al montar la app
  syncPreferences: () => void
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  isPaused: false,
  isRunActive: false,
  runScore: 0,
  runCoins: 0,
  lastRunResult: null,
  lastSubmitResult: null,
  isSubmitting: false,
  musicEnabled: true,
  sfxEnabled: true,
  vibrationEnabled: true,
  quality: 'high',

  startRun: () =>
    set({ isRunActive: true, isPaused: false, runScore: 0, runCoins: 0, lastRunResult: null, lastSubmitResult: null }),

  pauseRun: () => set({ isPaused: true }),

  resumeRun: () => set({ isPaused: false }),

  updateRunScore: (score, coins) => set({ runScore: score, runCoins: coins }),

  endRun: async (result) => {
    set({ isRunActive: false, isPaused: false, lastRunResult: result, isSubmitting: true })

    const submitResult = await submitRun(result)
    set({ lastSubmitResult: submitResult, isSubmitting: false })

    // Refrescar wallet y nivel del jugador en el store global
    if (submitResult.ok) {
      await usePlayerStore.getState().refreshWallet()
    }
  },

  setMusicEnabled: (value) => {
    set({ musicEnabled: value })
    usePlayerStore.getState().setPreferences({ musicEnabled: value })
  },

  setSfxEnabled: (value) => {
    set({ sfxEnabled: value })
    usePlayerStore.getState().setPreferences({ sfxEnabled: value })
  },

  setVibrationEnabled: (value) => {
    set({ vibrationEnabled: value })
    usePlayerStore.getState().setPreferences({ vibrationEnabled: value })
  },

  setQuality: (value) => {
    set({ quality: value })
    usePlayerStore.getState().setPreferences({ graphicsQuality: value })
  },

  syncPreferences: () => {
    const { preferences } = usePlayerStore.getState()
    if (!preferences) return
    set({
      musicEnabled:     preferences.musicEnabled,
      sfxEnabled:       preferences.sfxEnabled,
      vibrationEnabled: preferences.vibrationEnabled,
      quality:          preferences.graphicsQuality,
    })
  },
}))
